import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import debounce from 'lodash/debounce';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import SplitButton from 'react-bootstrap/SplitButton';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as ERLogo } from '../../common/images/icons/er-logo.svg';
import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';
import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import activitySectionStyles from '../../DetailViewComponents/ActivitySection/styles.module.scss';
import { addEventToIncident, createEvent, fetchEvent, setEventState } from '../../ducks/events';
import { areCardsEquals as areNotesEqual } from '../../DetailViewComponents/utils';
import { addReportFormProps } from '../../proptypes';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../utils/file';
import {
  createNewIncidentCollection,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  formValidator,
  isReportActive,
  setOriginalTextToEventNotes
} from '../../utils/events';
import { createNewReportForEventType } from '../../utils/events';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../../utils/save';
import { extractObjectDifference } from '../../utils/objects';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { fetchPatrol } from '../../ducks/patrols';
import { getSchemasForEventTypeByEventId } from '../../utils/event-schemas';
import { setLocallyEditedEvent, unsetLocallyEditedEvent } from '../../ducks/locally-edited-event';
import { SidebarScrollContext } from '../../SidebarScrollContext';
import { TAB_KEYS } from '../../constants';
import { TrackerContext } from '../../utils/analytics';
import useNavigate from '../../hooks/useNavigate';
import { uuid } from '../../utils/string';

import ActivitySection from '../../DetailViewComponents/ActivitySection';
import AddAttachmentButton from '../../AddAttachmentButton';
import AddNoteButton from '../../AddNoteButton';
import AddReportButton from '../../DetailViewComponents/AddReportButton';
import DetailsSection from '../DetailsSection';
import ErrorMessages from '../../ErrorMessages';
import Header from '../Header';
import HistorySection from '../../DetailViewComponents/HistorySection';
import LinksSection from '../LinksSection';
import LoadingOverlay from '../../LoadingOverlay';
import NavigationPromptModal from '../../NavigationPromptModal';
import QuickLinks from '../../QuickLinks';

import styles from './styles.module.scss';

const CLEAR_ERRORS_TIMEOUT = 7000;
const FETCH_EVENT_DEBOUNCE_TIME = 300;
const QUICK_LINKS_SCROLL_TOP_OFFSET = 20;
const EVENT_DETAILS_KEY = 'event_details';
const EVENT_UPDATEABLE_FIELDS = [
  'event_details',
  'geometry',
  'location',
  'notes',
  'priority',
  'reported_by',
  'state',
  'time',
  'title',
];

const calculateFormattedReportDiffs = (reportForm, originalReport) => {
  const reportDifferences = extractObjectDifference(reportForm, originalReport);

  return Object.entries(reportDifferences).reduce((accumulator, [key, value]) => {
    const entries = Object.entries(value ?? {});

    if (!entries.length && key === EVENT_DETAILS_KEY) {
      accumulator.push([key, { tmpValue: value }]);
    } else if (EVENT_UPDATEABLE_FIELDS.includes(key)) {
      accumulator.push([key, value]);
    }
    return accumulator;
  }, []);
};

const calculateSchemaFieldsChanges = (reportField, reportSchemaProps, originalReport) => Object.entries(reportField).reduce((acc, [reportFieldKey, reportFieldValue]) => {
  const schemaDefaultValue = reportSchemaProps?.[reportFieldKey]?.default;
  const defValueHasChanged = schemaDefaultValue && reportFieldValue !== schemaDefaultValue;
  const hasReportValue = !schemaDefaultValue && (reportFieldValue !== null && reportFieldValue !== undefined);
  const defValueWasReset = reportFieldValue === schemaDefaultValue && reportFieldValue !== originalReport.event_details[reportFieldKey];
  return defValueHasChanged || hasReportValue || defValueWasReset ? { ...acc, [reportFieldKey]: reportFieldValue } : acc;
}, {});

const generateErrorListForApiResponseDetails = (response, t) => {
  try {
    const { response: { data: { status: { detail: details } } } } = response;
    return Object.entries(JSON.parse(details.replace(/'/g, '"')))
      .reduce((accumulator, [key, value]) =>
        [{ label: key, message: value }, ...accumulator],
      []);
  } catch (e) {
    return [{ label: t('reportDetailView.unknownErrorLabel') }];
  }
};

const ReportDetailView = ({
  className,
  formProps,
  isAddedReport,
  isNewReport,
  newReportTypeId,
  onAddReport,
  onSaveAddedReport: onSaveAddedReportCallback,
  reportData,
  reportId,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

  const reportTracker = useContext(TrackerContext);
  const { setScrollPosition } = useContext(SidebarScrollContext);

  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const eventStore = useSelector((state) => state.data.eventStore);
  const patrolStore = useSelector((state) => state.data.patrolStore);
  const reportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === newReportTypeId)
  );

  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);
  const printableContentRef = useRef(null);
  const submitFormButtonRef = useRef(null);

  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );

  const reportFromStore = setOriginalTextToEventNotes(eventStore[reportId]);

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [redirectTo, setRedirectTo] = useState(null);
  const [reportForm, setReportForm] = useState(isNewReport ? newReport : reportFromStore);
  const [saveError, setSaveError] = useState(null);

  const {
    onCancelAddedReport,
    onSaveError: onSaveErrorCallback,
    onSaveSuccess: onSaveSuccessCallback,
    redirectTo: redirectToFromFormProps,
    relationshipButtonDisabled,
  } = formProps || {};

  const originalReport = isNewReport ? newReport : reportFromStore;
  const isActive = isReportActive(originalReport);
  const isCollection = !!reportForm?.is_collection;
  const isCollectionChild = eventBelongsToCollection(reportForm);
  const isPatrolAddedReport = formProps?.hasOwnProperty('isPatrolReport') && formProps.isPatrolReport;
  const belongsToPatrol = eventBelongsToPatrol(reportForm);

  const containedReports = useMemo(
    () => reportForm?.contains?.map(({ related_event: report }) => report) || [],
    [reportForm?.contains]
  );

  const fetchEventDebounced = useMemo(
    () => debounce((id) => dispatch(fetchEvent(id)), FETCH_EVENT_DEBOUNCE_TIME, { leading: true }),
    [dispatch]
  );

  const linkedPatrolIds = reportForm?.patrols;
  const linkedPatrols = useMemo(
    () => linkedPatrolIds?.map((id) => patrolStore[id]).filter((patrol) => !!patrol) || [],
    [linkedPatrolIds, patrolStore]
  );

  const linkedReportIds = useMemo(() => {
    let linkedReportIds = [];

    if (Array.isArray(reportForm?.is_contained_in)) {
      linkedReportIds = [
        ...linkedReportIds,
        ...reportForm.is_contained_in.map((containedIn) => containedIn.related_event.id),
      ];
    }
    if (Array.isArray(reportForm?.is_linked_to)) {
      linkedReportIds = [...linkedReportIds, ...reportForm.is_linked_to.map((linkedTo) => linkedTo.related_event.id)];
    }

    return linkedReportIds;
  }, [reportForm.is_contained_in, reportForm.is_linked_to]);

  const linkedReports = useMemo(
    () => linkedReportIds?.map((id) => eventStore[id]).filter((report) => !!report) || [],
    [eventStore, linkedReportIds]
  );

  const reportAttachments = useMemo(
    () => Array.isArray(reportForm?.files) ? reportForm.files : [],
    [reportForm?.files]
  );

  const reportNotes = useMemo(() => Array.isArray(reportForm?.notes) ? [...reportForm.notes] : [], [reportForm?.notes]);

  const reportSchemas = reportForm
    ? getSchemasForEventTypeByEventId(eventSchemas, reportForm.event_type, reportForm.id)
    : null;

  const reportChanges = useMemo(() => {
    if (!originalReport || !reportForm) {
      return {};
    }

    const { properties: schemaProps } = reportSchemas?.schema ?? {};
    const formattedReportDiffs = calculateFormattedReportDiffs(reportForm, originalReport);
    return formattedReportDiffs.reduce((accumulator, [key, reportField]) => {
      if (key === EVENT_DETAILS_KEY) {
        const reportFieldsChanges = calculateSchemaFieldsChanges(reportField, schemaProps, originalReport);
        return Object.entries(reportFieldsChanges).length > 0
          ? { ...accumulator, [key]: reportFieldsChanges }
          : accumulator;
      }

      return { ...accumulator, [key]: reportField };
    }, {});
  }, [originalReport, reportForm, reportSchemas]);

  const newNotesAdded = useMemo(
    () => notesToAdd.length > 0 && notesToAdd.some((noteToAdd) => noteToAdd.text),
    [notesToAdd]
  );

  const shouldShowNavigationPrompt =
    !isSaving
    && !redirectTo
    && (
      (isAddedReport || isPatrolAddedReport)
      || attachmentsToAdd.length > 0
      || newNotesAdded
      || Object.keys(reportChanges).length > 0
    );

  const showAddReportButton = !isAddedReport
    && !isPatrolAddedReport
    && !belongsToPatrol
    && !relationshipButtonDisabled
    && !isCollectionChild;

  const onClearErrors = useCallback(() => setSaveError(null), []);

  const onSaveSuccess = useCallback((reportToSubmit, redirectTo) => async (results) => {
    await onSaveSuccessCallback?.(results);

    if (isAddedReport) {
      onSaveAddedReportCallback?.();
    } else if (redirectToFromFormProps || redirectTo) {
      setRedirectTo(redirectToFromFormProps || redirectTo);
      setScrollPosition(TAB_KEYS.EVENTS, 0);
    }

    if (reportToSubmit.is_collection && reportToSubmit.state) {
      return Promise.all(reportToSubmit.contains
        .map(contained => contained.related_event.id)
        .map(id => dispatch(setEventState(id, reportToSubmit.state))));
    }

    return results;
  }, [
    dispatch,
    isAddedReport,
    onSaveAddedReportCallback,
    onSaveSuccessCallback,
    redirectToFromFormProps,
    setScrollPosition,
  ]);

  const onSaveError = useCallback((e) => {
    setSaveError(generateErrorListForApiResponseDetails(e, t));
    onSaveErrorCallback?.(e);
    setTimeout(onClearErrors, CLEAR_ERRORS_TIMEOUT);
  }, [onClearErrors, onSaveErrorCallback, t]);

  const onSaveReport = useCallback((redirectToAfterSave, shouldFetchAfterSave = !isAddedReport) => {
    if (isSaving) {
      return;
    }

    reportTracker.track(`Start save for ${isNewReport ? 'new' : 'existing'} report`);

    setIsSaving(true);

    let reportToSubmit;
    if (isNewReport) {
      reportToSubmit = reportForm;

      if (reportToSubmit.hasOwnProperty('location') && !reportToSubmit.location) {
        reportToSubmit.location = null;
      }
    } else {
      reportToSubmit = {
        ...reportChanges,
        id: reportForm.id,
        event_details: { ...originalReport.event_details, ...reportChanges.event_details },
        location: originalReport.location,
      };

      if (reportChanges.hasOwnProperty('location')) {
        reportToSubmit.location = !!reportChanges.location
          ? { ...originalReport.location, ...reportChanges.location }
          : null;
      }

      if (reportChanges.hasOwnProperty('reported_by')) {
        reportToSubmit.reported_by = reportForm.reported_by;
      }

      if (reportChanges.notes) {
        reportToSubmit.notes = reportForm.notes.map((note) => ({ ...note, text: note.text.trim() }));
      }

      if (reportToSubmit.contains) {
        delete reportToSubmit.contains;
      }
    }

    const newNotes = notesToAdd.reduce(
      (accumulator, noteToAdd) => noteToAdd.text ? [...accumulator, { text: noteToAdd.text.trim(), tmpId: undefined }] : accumulator,
      []
    );
    const newAttachments = attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file);
    const saveActions = generateSaveActionsForReportLikeObject(reportToSubmit, 'report', newNotes, newAttachments);
    return executeSaveActions(saveActions)
      .then((results) => {
        if (reportForm.is_collection && reportChanges.state) {
          return Promise.all((reportForm?.contains ?? [])
            .map(contained => contained.related_event.id)
            .map(id => dispatch(setEventState(id, reportChanges.state))));
        }
        return results;
      })
      .then(onSaveSuccess(reportToSubmit, redirectToAfterSave))
      .then((results) => {
        if (shouldFetchAfterSave) {
          const createdReport = results.length ? results[0] : results;
          dispatch(fetchEvent(createdReport.data.data.id));
        }
        return results;
      })
      .catch(onSaveError)
      .finally(() => setIsSaving(false));
  }, [
    attachmentsToAdd,
    dispatch,
    isAddedReport,
    isNewReport,
    isSaving,
    notesToAdd,
    onSaveError,
    onSaveSuccess,
    originalReport.event_details,
    originalReport.location,
    reportChanges,
    reportForm,
    reportTracker
  ]);

  const onChangeTitle = useCallback(
    (newTitle) => setReportForm({ ...reportForm, title: newTitle }),
    [reportForm, setReportForm]
  );

  const onReportedByChange = useCallback((selection) => {
    const reportedBySelection = { reported_by: selection || null };
    const selectionCoordinates = selection?.last_position?.geometry?.coordinates;
    if (selectionCoordinates) {
      reportedBySelection.location = { latitude: selectionCoordinates[1], longitude: selectionCoordinates[0] };
    }

    setReportForm({ ...reportForm, ...reportedBySelection });

    reportTracker.track('Change Report Reported By');
  }, [reportForm, reportTracker, setReportForm]);

  const onPriorityChange = useCallback(({ value: priority }) => {
    setReportForm({ ...reportForm, priority });

    reportTracker.track('Click \'Priority\' option', `Priority:${priority}`);
  }, [reportForm, reportTracker]);

  const onReportGeometryChange = useCallback((geometry) => {
    setReportForm({ ...reportForm, geometry, location: null });

    reportTracker.track('Change Report Geometry');
  }, [reportForm, reportTracker]);

  const onReportLocationChange = useCallback((location) => {
    const updatedLocation = !!location ? { latitude: location[1], longitude: location[0] } : null;

    setReportForm({ ...reportForm, location: updatedLocation });

    reportTracker.track('Change Report Location');
  }, [reportForm, reportTracker]);

  const onReportDateChange = useCallback((date) => {
    const now = new Date();

    setReportForm({ ...reportForm, time: date > now ? now : date });

    reportTracker.track('Change Report Date');
  }, [reportForm, reportTracker]);

  const onReportTimeChange = useCallback((time) => {
    const newTimeParts = time.split(':');
    const updatedDateTime = new Date(reportForm.time);
    updatedDateTime.setHours(newTimeParts[0], newTimeParts[1], '00');

    setReportForm({ ...reportForm, time: updatedDateTime });

    reportTracker.track('Change Report Time');
  }, [reportForm, reportTracker]);

  const onReportStateChange = useCallback((state) => {
    setReportForm({ ...reportForm, state });

    reportTracker.track(`Change Report State to ${state}`);
  }, [reportForm, reportTracker]);

  const onFormChange = useCallback((event) => {
    const formData = Object.entries(event.formData).reduce((acc, [formKey, formData]) => ({
      ...acc,
      [formKey]: formData === undefined ? '' : formData
    }), {});

    setReportForm({ ...reportForm, event_details: { ...reportForm.event_details, ...formData } });

  }, [reportForm]);

  const onFormError = useCallback((errors) => {
    const formattedErrors = errors.map((error) => ({
      ...error,
      label: reportSchemas.schema?.properties?.[error.linearProperty]?.title ?? error.linearProperty,
    }));

    setSaveError([...formattedErrors]);
  }, [reportSchemas?.schema?.properties]);

  const onFormSubmit = useCallback(() => onSaveReport(`/${TAB_KEYS.EVENTS}`), [onSaveReport]);

  const onDeleteAttachment = useCallback((attachment) => {
    setAttachmentsToAdd(attachmentsToAdd.filter((attachmentToAdd) => attachmentToAdd.file.name !== attachment.name));
  }, [attachmentsToAdd]);

  const onDoneNote = useCallback((note) => {
    const isNew = !!note.tmpId;
    const notes = isNew ? notesToAdd : reportNotes;
    const updatedNotes = notes.map((currentNote) => {
      if (areNotesEqual(currentNote, note)) {
        const text = currentNote.text.trim();
        return {
          ...currentNote,
          originalText: text,
          text
        };
      }
      return currentNote;
    });

    if (isNew) {
      setNotesToAdd(updatedNotes);
    } else {
      setReportForm({ ...reportForm, notes: updatedNotes });
    }
  }, [notesToAdd, reportForm, reportNotes]);

  const onDeleteNote = useCallback((note) => {
    setNotesToAdd(notesToAdd.filter((noteToAdd) => noteToAdd !== note));
  }, [notesToAdd]);

  const onCancelNote = useCallback((note) => {
    const isNew = !!note.tmpId;
    const notes = isNew ? notesToAdd : reportNotes;
    const updatedNotes = notes.map((currentNote) =>
      areNotesEqual(currentNote, note)
        ? { ...currentNote, text: currentNote.originalText }
        : currentNote
    );
    if (isNew) {
      setNotesToAdd(updatedNotes);
    } else {
      setReportForm({ ...reportForm, notes: updatedNotes });
    }
  }, [notesToAdd, reportForm, reportNotes]);

  const onChangeNote = useCallback((originalNote, { target: { value } }) => {
    const editedNote = {
      ...originalNote,
      text: value
    };
    const isNew = !!originalNote.tmpId;

    if (isNew) {
      setNotesToAdd(notesToAdd.map((noteToAdd) => noteToAdd === originalNote ? editedNote : noteToAdd));
    } else {
      setReportForm({
        ...reportForm,
        notes: reportNotes.map((reportNote) => reportNote === originalNote ? editedNote : reportNote),
      });
    }

    return editedNote;
  }, [notesToAdd, reportForm, reportNotes, setReportForm]);

  const onAddNote = useCallback(() => {
    const userHasNewNoteEmpty = notesToAdd.some((noteToAdd) => !noteToAdd.originalText);
    if (userHasNewNoteEmpty) {
      window.alert(t('reportDetailView.cantAddNoteAlert'));
    } else {
      const newNote = {
        creationDate: new Date().toISOString(),
        ref: newNoteRef,
        text: '',
        tmpId: uuid(),
      };
      setNotesToAdd([...notesToAdd, newNote]);

      reportTracker.track('Added Note');

      setTimeout(() => {
        newNoteRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
      }, parseFloat(activitySectionStyles.cardToggleTransitionTime));
    }
  }, [notesToAdd, reportTracker, t]);

  const onAddAttachments = useCallback((files) => {
    const filesArray = convertFileListToArray(files);
    const uploadableFiles = filterDuplicateUploadFilenames(
      [...reportAttachments, ...attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file)],
      filesArray
    );

    if (uploadableFiles.length) {
      setTimeout(() => {
        newAttachmentRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
      }, parseFloat(activitySectionStyles.cardToggleTransitionTime));

      setAttachmentsToAdd([
        ...attachmentsToAdd,
        ...uploadableFiles.map((uploadableFile) => ({ file: uploadableFile, creationDate: new Date().toISOString(), ref: newAttachmentRef })),
      ]);

      reportTracker.track('Added Attachment');
    }

  }, [attachmentsToAdd, reportAttachments, reportTracker]);

  const onSaveAddedReport = useCallback(([{ data: { data: secondReportSaved } }]) => {
    try {
      onSaveReport(undefined, false).then(async ([{ data: { data: thisReportSaved } }]) => {
        if (reportForm.is_collection) {
          reportTracker.track('Added report to incident');

          await dispatch(addEventToIncident(secondReportSaved.id, thisReportSaved.id));

          dispatch(fetchEvent(secondReportSaved.id));
          const collectionRefreshedResults = await dispatch(fetchEvent(thisReportSaved.id));

          setReportForm(collectionRefreshedResults.data.data);
          onSaveSuccess({})(collectionRefreshedResults);
        } else {
          setIsSaving(true);
          const { data: { data: incidentCollection } } = await dispatch(createEvent(createNewIncidentCollection()));
          await Promise.all([thisReportSaved.id, secondReportSaved.id]
            .map(id => dispatch(addEventToIncident(id, incidentCollection.id))));

          dispatch(fetchEvent(thisReportSaved.id));
          dispatch(fetchEvent(secondReportSaved.id));
          const collectionRefreshedResults = await dispatch(fetchEvent(incidentCollection.id));
          const { data: { data: { id: collectionId, contains } } } = collectionRefreshedResults;
          const [, originalReport] = contains;

          reportTracker.track('Added report to report');
          onSaveSuccess({}, [
            `/${TAB_KEYS.EVENTS}/${collectionId}`,
            { state: { relatedEvent: originalReport.related_event.id }, replace: true }
          ])(collectionRefreshedResults);
        }
      });
    } catch (e) {
      setIsSaving(false);
      onSaveError(e);
    }
  }, [dispatch, onSaveError, onSaveReport, onSaveSuccess, reportForm.is_collection, reportTracker]);

  const onClickSaveButton = useCallback(() => {
    reportTracker.track('Click "save" button');

    submitFormButtonRef?.current?.click();
  }, [reportTracker]);

  const onClickSaveAndToggleStateButton = useCallback(() => {
    setReportForm({ ...reportForm, state: isActive ? 'resolved' : 'active' });
    setTimeout(() => {
      onClickSaveButton();
    });
  }, [isActive, onClickSaveButton, reportForm]);

  const trackDiscard = useCallback(() => {
    reportTracker.track(`Discard changes to ${isNewReport ? 'new' : 'existing'} report`);
  }, [isNewReport, reportTracker]);

  const onNavigationContinue = useCallback(async (shouldSave = false) => {
    if (shouldSave && !isPatrolAddedReport) {
      onClickSaveButton();
      return !formValidator.validateFormData(reportForm, reportSchemas?.schema)?.errors?.length;
    }

    if (shouldSave && isPatrolAddedReport) {
      await onSaveReport();
    }

    if (!shouldSave) {
      if (isAddedReport) {
        onCancelAddedReport?.();
      }
      trackDiscard();
    }

    return true;
  }, [
    isPatrolAddedReport,
    onClickSaveButton,
    reportForm,
    reportSchemas?.schema,
    onSaveReport,
    isAddedReport,
    trackDiscard,
    onCancelAddedReport,
  ]);

  const onClickCancelButton = useCallback(() => {
    reportTracker.track('Click "cancel" button');

    if (isAddedReport) {
      navigate(
        `${location.pathname}${location.search}`,
        { replace: true, state: location.state }
      );
    } else if (isPatrolAddedReport) {
      navigate(...redirectToFromFormProps);
    } else {
      navigate(`/${TAB_KEYS.EVENTS}`);
    }
  }, [
    isAddedReport,
    isPatrolAddedReport,
    location.pathname,
    location.search,
    location.state,
    navigate,
    redirectToFromFormProps,
    reportTracker,
  ]);

  useEffect(() => {
    if (!!reportForm && !reportSchemas) {
      dispatch(fetchEventTypeSchema(reportForm.event_type, reportForm.id));
    }
  }, [dispatch, reportForm, reportSchemas]);

  useEffect(() => {
    if (linkedPatrolIds?.length > 0) {
      linkedPatrolIds.forEach((id) => !patrolStore[id] && dispatch(fetchPatrol(id)));
    }
  }, [dispatch, linkedPatrolIds, patrolStore]);

  useEffect(() => {
    if (linkedReportIds?.length > 0) {
      linkedReportIds.forEach((id) => !eventStore[id] && fetchEventDebounced(id));
    }
  }, [eventStore, fetchEventDebounced, linkedReportIds]);

  useEffect(() => {
    if (redirectTo) {
      navigate(...(Array.isArray(redirectTo) ? redirectTo : [redirectTo]));
    }
  }, [navigate, redirectTo]);

  useEffect(() => {
    const shouldUpdateMapEvent = reportChanges?.geometry ||
      reportChanges?.location ||
      reportChanges?.priority ||
      reportChanges?.time ||
      reportChanges?.title;
    if (!isNewReport && shouldUpdateMapEvent) {
      dispatch(setLocallyEditedEvent(reportForm));
    } else {
      dispatch(unsetLocallyEditedEvent());
    }
  }, [
    dispatch,
    isNewReport,
    reportChanges?.geometry,
    reportChanges?.location,
    reportChanges?.priority,
    reportChanges?.time,
    reportChanges?.title,
    reportForm,
  ]);

  useEffect(() => () => dispatch(unsetLocallyEditedEvent()), [dispatch]);

  const shouldRenderActivitySection = (reportAttachments.length
    + attachmentsToAdd.length
    + reportNotes.length
    + notesToAdd.length
    + containedReports.length) > 0;
  const shouldRenderHistorySection = reportForm?.updates;
  const shouldRenderLinksSection = !!linkedReports.length || !!linkedPatrols.length;

  const isReadOnly = reportSchemas?.schema?.readonly;

  return <div
    className={`${styles.reportDetailView} ${className || ''} ${isReadOnly ? styles.readonly : ''}`}
    data-testid="reportManagerContainer"
    ref={printableContentRef}
    >
    {isSaving && <LoadingOverlay className={styles.loadingOverlay} message={t('reportDetailView.loadingMessage')} />}

    <NavigationPromptModal onContinue={onNavigationContinue} when={shouldShowNavigationPrompt} />

    <ERLogo className={styles.printLogo} />

    <Header
      isReadOnly={isReadOnly}
      onChangeTitle={onChangeTitle}
      onSaveReport={onSaveReport}
      printableContentRef={printableContentRef}
      report={reportForm}
      setRedirectTo={setRedirectTo}
    />

    {saveError && <ErrorMessages
      errorData={saveError}
      onClose={onClearErrors}
      title={t('reportDetailView.saveErrorMessage')}
    />}

    <div className={styles.body}>
      <QuickLinks scrollTopOffset={QUICK_LINKS_SCROLL_TOP_OFFSET}>
        <QuickLinks.NavigationBar className={styles.navigationBar}>
          <QuickLinks.Anchor
            anchorTitle={t('reportDetailView.quickLinks.detailsAnchor')}
            iconComponent={<PencilWritingIcon />}
            onClick={() => reportTracker.track(
              `Click the "Details" quicklink in a ${isNewReport ? 'new' : 'existing'} report`
            )}
          />

          <QuickLinks.Anchor
            anchorTitle={t('reportDetailView.quickLinks.activityAnchor')}
            iconComponent={<BulletListIcon />}
            onClick={() => reportTracker.track(
              `Click the "Activity" quicklink in a ${isNewReport ? 'new' : 'existing'} report`
            )}
          />

          <QuickLinks.Anchor
            anchorTitle={t('reportDetailView.quickLinks.linksAnchor')}
            iconComponent={<LinkIcon />}
            onClick={() => reportTracker.track(
              `Click the "Links" quicklink in a ${isNewReport ? 'new' : 'existing'} report`
            )}
          />

          <QuickLinks.Anchor
            anchorTitle={t('reportDetailView.quickLinks.historyAnchor')}
            iconComponent={<HistoryIcon />}
            onClick={() => reportTracker.track(
              `Click the "History" quicklink in a ${isNewReport ? 'new' : 'existing'} report`
            )}
          />
        </QuickLinks.NavigationBar>

        <div className={styles.content}>
          <QuickLinks.SectionsWrapper>
            <QuickLinks.Section anchorTitle={t('reportDetailView.quickLinks.detailsAnchor')}>
              <DetailsSection
                formSchema={reportSchemas?.schema}
                formUISchema={reportSchemas?.uiSchema}
                isCollection={isCollection}
                loadingSchema={!!eventSchemas.loading}
                onFormChange={onFormChange}
                onFormError={onFormError}
                onFormSubmit={onFormSubmit}
                onPriorityChange={onPriorityChange}
                onReportDateChange={onReportDateChange}
                onReportedByChange={onReportedByChange}
                onReportGeometryChange={onReportGeometryChange}
                onReportLocationChange={onReportLocationChange}
                onReportStateChange={onReportStateChange}
                onReportTimeChange={onReportTimeChange}
                originalReport={originalReport}
                reportForm={reportForm}
                submitFormButtonRef={submitFormButtonRef}
                formValidator={formValidator}
              />
            </QuickLinks.Section>

            {shouldRenderActivitySection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section
              anchorTitle={t('reportDetailView.quickLinks.activityAnchor')}
              hidden={!shouldRenderActivitySection}
            >
              <ActivitySection
                attachments={reportAttachments}
                attachmentsToAdd={attachmentsToAdd}
                containedReports={containedReports}
                notes={reportNotes}
                notesToAdd={notesToAdd}
                onDeleteAttachment={onDeleteAttachment}
                onDeleteNote={onDeleteNote}
                onChangeNote={onChangeNote}
                reportAttachments={reportAttachments}
                reportNotes={reportNotes}
                onCancelNote={onCancelNote}
                onDoneNote={onDoneNote}
              />
            </QuickLinks.Section>

            {shouldRenderLinksSection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section
              anchorTitle={t('reportDetailView.quickLinks.linksAnchor')}
              hidden={!shouldRenderLinksSection}
            >
              <LinksSection linkedPatrols={linkedPatrols} linkedReports={linkedReports} />
            </QuickLinks.Section>

            {shouldRenderHistorySection && <div className={styles.historySectionSeparation} />}

            <QuickLinks.Section
              anchorTitle={t('reportDetailView.quickLinks.historyAnchor')}
              hidden={!shouldRenderHistorySection}
            >
              <HistorySection className={styles.historySection} updates={reportForm?.updates || []} />
            </QuickLinks.Section>
          </QuickLinks.SectionsWrapper>

          <div className={styles.footer}>
            <div className={styles.footerActionButtonsContainer}>
              <AddNoteButton
                className={styles.footerActionButton}
                data-testid={`reportDetailView-addNoteButton-${isAddedReport ? 'added' : 'original'}`}
                onAddNote={onAddNote}
              />

              <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

              {showAddReportButton && <AddReportButton
                className={styles.footerActionButton}
                formProps={{ onSaveSuccess: onSaveAddedReport, relationshipButtonDisabled: true }}
                onAddReport={onAddReport}
              />}
            </div>

            <div className={styles.actionButtons}>
              <Button
                data-testid="report-details-cancel-btn"
                className={styles.cancelButton}
                onClick={onClickCancelButton}
                type="button"
                variant="secondary"
              >
                {t('reportDetailView.cancelButton')}
              </Button>

              <SplitButton
                className={styles.saveButton}
                drop="down"
                variant="primary"
                type="button"
                title={t('reportDetailView.saveSplitButton.title')}
                onClick={onClickSaveButton}
              >
                <Dropdown.Item className={styles.saveSplitButtonItem} data-testid="report-details-resolve-btn-toggle">
                  <Button onClick={onClickSaveAndToggleStateButton} type="button" variant="primary">
                    {t(`reportDetailView.saveSplitButton.${isActive ? 'saveAndResolveItem' : 'saveAndReopenItem'}`)}
                  </Button>
                </Dropdown.Item>
              </SplitButton>
            </div>
          </div>
        </div>
      </QuickLinks>
    </div>
  </div>;
};

ReportDetailView.defaulProps = {
  className: '',
  formProps: {},
  isAddedReport: false,
  newReportTypeId: null,
  onAddReport: null,
  onSaveAddedReport: null,
  reportData: null,
};

ReportDetailView.propTypes = {
  className: PropTypes.string,
  formProps: addReportFormProps,
  isAddedReport: PropTypes.bool,
  isNewReport: PropTypes.bool.isRequired,
  newReportTypeId: PropTypes.string,
  onAddReport: PropTypes.func,
  onSaveAddedReport: PropTypes.func,
  reportData: PropTypes.object,
  reportId: PropTypes.string.isRequired,
};

export default memo(ReportDetailView);
