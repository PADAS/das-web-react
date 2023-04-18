import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SplitButton from 'react-bootstrap/SplitButton';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';
import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { addEventToIncident, createEvent, fetchEvent, setEventState } from '../../ducks/events';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../utils/file';
import { TrackerContext } from '../../utils/analytics';
import {
  createNewIncidentCollection,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  generateErrorListForApiResponseDetails
} from '../../utils/events';
import { createNewReportForEventType } from '../../utils/events';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../../utils/save';
import { extractObjectDifference } from '../../utils/objects';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { fetchPatrol } from '../../ducks/patrols';
import { getSchemasForEventTypeByEventId } from '../../utils/event-schemas';
import { setLocallyEditedEvent, unsetLocallyEditedEvent } from '../../ducks/locally-edited-event';
import { TAB_KEYS } from '../../constants';
import useNavigate from '../../hooks/useNavigate';
import { useLocation } from 'react-router-dom';

import ActivitySection from '../ActivitySection';
import AddAttachmentButton from '../../AddAttachmentButton';
import AddNoteButton from '../../AddNoteButton';
import AddReportButton from '../AddReportButton';
import DetailsSection from '../DetailsSection';
import ErrorMessages from '../../ErrorMessages';
import Header from '../Header';
import HistorySection from '../HistorySection';
import LinksSection from '../LinksSection';
import LoadingOverlay from '../../LoadingOverlay';
import NavigationPromptModal from '../../NavigationPromptModal';
import QuickLinks from '../../QuickLinks';

import styles from './styles.module.scss';
import activitySectionStyles from '../ActivitySection/styles.module.scss';

const CLEAR_ERRORS_TIMEOUT = 7000;
const FETCH_EVENT_DEBOUNCE_TIME = 300;
const QUICK_LINKS_SCROLL_TOP_OFFSET = 20;

const ACTIVE_STATES = ['active', 'new'];

const ReportDetailView = ({
  className,
  formProps,
  isAddedReport,
  isNewReport,
  newReportTypeId,
  onAddReport,
  onCancelAddedReport,
  onSaveAddedReport: onSaveAddedReportCallback,
  reportData,
  reportId,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const patrolStore = useSelector((state) => state.data.patrolStore);
  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const eventStore = useSelector((state) => state.data.eventStore);
  const reportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === newReportTypeId)
  );

  const submitFormButtonRef = useRef(null);
  const newNoteRef = useRef(null);
  const newAttachmentRef = useRef(null);

  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [reportForm, setReportForm] = useState(isNewReport ? newReport : eventStore[reportId]);
  const [saveError, setSaveError] = useState(null);
  const [unsavedReportNotes, setUnsavedReportNotes] = useState([]);

  const reportTracker = useContext(TrackerContext);

  const {
    onSaveError: onSaveErrorCallback,
    onSaveSuccess: onSaveSuccessCallback,
    relationshipButtonDisabled,
  } = formProps || {};

  const originalReport = isNewReport ? newReport : eventStore[reportId];
  const isActive = ACTIVE_STATES.includes(originalReport?.state);

  const isCollection = !!reportForm?.is_collection;
  const isCollectionChild = eventBelongsToCollection(reportForm);
  const isPatrolReport = eventBelongsToPatrol(reportForm);

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
  const reportNotes = useMemo(() => Array.isArray(reportForm?.notes) ? reportForm.notes : [], [reportForm?.notes]);

  const reportSchemas = reportForm
    ? getSchemasForEventTypeByEventId(eventSchemas, reportForm.event_type, reportForm.id)
    : null;

  const reportChanges = useMemo(() => {
    if (!originalReport || !reportForm) {
      return {};
    }

    return Object.entries(extractObjectDifference(reportForm, originalReport))
      .reduce((accumulator, [key, value]) => key !== 'contains' ? { ...accumulator, [key]: value } : accumulator, {});
  }, [originalReport, reportForm]);

  const newNotesAdded = useMemo(
    () => notesToAdd.length > 0 && notesToAdd.some((noteToAdd) => noteToAdd.text),
    [notesToAdd]
  );

  const backupUnsavedNote = useCallback((note, updatedText, notes, setter) => {
    const noteId = note.creationDate ?? note.id;
    const backupNote = notes.find(({ creationDate, id }) => noteId === creationDate || noteId === id);

    if (!backupNote){
      setter([...notes, { ...note, text: updatedText }]);
    } else {
      const updatedNotes = notes.map((currentNote) => {
        const { text } = currentNote;
        const currentId = currentNote.creationDate ?? currentNote.id;
        if (currentId === noteId && updatedText !== text){
          return { ...currentNote, text: updatedText };
        }
        return currentNote;
      });
      setter(updatedNotes);
    }
  }, []);

  const onNoteItemBlur = useCallback((note, updatedText) => {
    const isNewNote = !!note.creationDate;
    if (isNewNote){
      backupUnsavedNote(note, updatedText, notesToAdd, setNotesToAdd);
    } else {
      backupUnsavedNote(note, updatedText, unsavedReportNotes, setUnsavedReportNotes);
    }
  }, [backupUnsavedNote, notesToAdd, unsavedReportNotes]);

  const shouldShowNavigationPrompt =
    !isSaving
    && !redirectTo
    && (
      isAddedReport
      || attachmentsToAdd.length > 0
      || newNotesAdded
      || Object.keys(reportChanges).length > 0
      || unsavedReportNotes.length > 0
    );

  const showAddReportButton = !isAddedReport
    && !relationshipButtonDisabled
    && (isCollection || (!isPatrolReport && !isCollectionChild));

  const onClearErrors = useCallback(() => setSaveError(null), []);

  const onSaveSuccess = useCallback((reportToSubmit, redirectTo) => (results) => {
    onSaveSuccessCallback?.(results);

    if (isAddedReport) {
      onSaveAddedReportCallback?.();
    } else if (redirectTo) {
      setRedirectTo(redirectTo);
    }

    if (reportToSubmit.is_collection && reportToSubmit.state) {
      return Promise.all(reportToSubmit.contains
        .map(contained => contained.related_event.id)
        .map(id => dispatch(setEventState(id, reportToSubmit.state))));
    }

    return results;
  }, [dispatch, isAddedReport, onSaveAddedReportCallback, onSaveSuccessCallback]);

  const onSaveError = useCallback((e) => {
    setSaveError(generateErrorListForApiResponseDetails(e));
    onSaveErrorCallback?.(e);
    setTimeout(onClearErrors, CLEAR_ERRORS_TIMEOUT);
  }, [onClearErrors, onSaveErrorCallback]);

  const onSaveReport = useCallback((shouldRedirectAfterSave = true) => {
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

      if (unsavedReportNotes.length > 0) {
        reportToSubmit.notes = reportForm.notes.map((currentNote) => {
          const unsavedReportNote = unsavedReportNotes.find(({ created_at }) => currentNote.created_at === created_at);
          if (unsavedReportNote){
            return {
              ...currentNote,
              text: unsavedReportNote.text
            };
          }
          return currentNote;
        });
      }

      if (reportToSubmit.contains) {
        delete reportToSubmit.contains;
      }
    }

    const newNotes = notesToAdd.reduce(
      (accumulator, noteToAdd) => noteToAdd.text ? [...accumulator, { text: noteToAdd.text }] : accumulator,
      []
    );
    const newAttachments = attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file);
    const saveActions = generateSaveActionsForReportLikeObject(reportToSubmit, 'report', newNotes, newAttachments);
    return executeSaveActions(saveActions)
      .then(onSaveSuccess(reportToSubmit, shouldRedirectAfterSave ? `/${TAB_KEYS.REPORTS}` : undefined))
      .catch(onSaveError)
      .finally(() => setIsSaving(false));
  }, [
    attachmentsToAdd,
    isNewReport,
    isSaving,
    notesToAdd,
    onSaveError,
    onSaveSuccess,
    originalReport.event_details,
    originalReport.location,
    reportChanges,
    reportForm,
    reportTracker,
    unsavedReportNotes
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
    setReportForm({ ...reportForm, event_details: { ...reportForm.event_details, ...event.formData } });

    reportTracker.track('Change Report Form Data');
  }, [reportForm, reportTracker]);

  const onFormError = (errors) => {
    const formattedErrors = errors.map((error) => ({
      ...error,
      label: reportSchemas.schema?.properties?.[error.linearProperty]?.title ?? error.linearProperty,
    }));

    setSaveError([...formattedErrors]);
  };

  const onDeleteAttachment = useCallback((attachment) => {
    setAttachmentsToAdd(attachmentsToAdd.filter((attachmentToAdd) => attachmentToAdd.file.name !== attachment.name));
  }, [attachmentsToAdd]);

  const onDeleteNote = useCallback((note) => {
    setNotesToAdd(notesToAdd.filter((noteToAdd) => noteToAdd !== note));
  }, [notesToAdd]);

  const onCancelNote = useCallback((note) => {
    setUnsavedReportNotes(unsavedReportNotes.filter(({ id }) => id !== note.id));
  }, [unsavedReportNotes]);

  const onSaveNote = useCallback((originalNote, updatedNote) => {
    const editedNote = { ...originalNote, text: updatedNote.text };

    const isNew = !originalNote.id;
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
    const userHasNewNoteEmpty = notesToAdd.some((noteToAdd) => !noteToAdd.text);
    if (userHasNewNoteEmpty) {
      window.alert('Can not add a new note: there\'s an empty note not saved yet');
    } else {
      const newNote = { creationDate: new Date().toISOString(), ref: newNoteRef, text: '' };
      setNotesToAdd([...notesToAdd, newNote]);
      reportTracker.track('Added Note');

      setTimeout(() => {
        newNoteRef?.current?.scrollIntoView?.({
          behavior: 'smooth',
        });
      }, parseFloat(activitySectionStyles.cardToggleTransitionTime));
    }
  }, [notesToAdd, reportTracker]);

  const onAddAttachments = useCallback((files) => {
    const filesArray = convertFileListToArray(files);
    const uploadableFiles = filterDuplicateUploadFilenames(
      [...reportAttachments, ...attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file)],
      filesArray
    );
    setAttachmentsToAdd([
      ...attachmentsToAdd,
      ...uploadableFiles.map((uploadableFile) => ({ file: uploadableFile, creationDate: new Date().toISOString(), ref: newAttachmentRef })),
    ]);

    setTimeout(() => {
      newAttachmentRef?.current?.scrollIntoView?.({
        behavior: 'smooth',
      });
    }, parseFloat(activitySectionStyles.cardToggleTransitionTime));

    reportTracker.track('Added Attachment');
  }, [attachmentsToAdd, reportAttachments, reportTracker]);

  const onSaveAddedReport = useCallback(([{ data: { data: secondReportSaved } }]) => {
    try {
      onSaveReport(false).then(async ([{ data: { data: thisReportSaved } }]) => {
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
          const { data: { data: { id: collectionId } } } = collectionRefreshedResults;

          reportTracker.track('Added report to report');
          onSaveSuccess({}, `/${TAB_KEYS.REPORTS}/${collectionId}`)(collectionRefreshedResults);
        }

      });
    } catch (e) {
      setIsSaving(false);
      onSaveError(e);
    }
  }, [dispatch, onSaveError, onSaveReport, onSaveSuccess, reportForm.is_collection, reportTracker]);

  const onClickSaveButton = useCallback(() => {
    reportTracker.track('Click "save" button');
    if (reportForm?.is_collection) {
      onSaveReport();
    } else if (submitFormButtonRef.current) {
      submitFormButtonRef.current.click();
    }
  }, [onSaveReport, reportForm?.is_collection, reportTracker]);

  const onClickSaveAndToggleStateButton = useCallback(() => {
    setReportForm({ ...reportForm, state: isActive ? 'resolved' : 'active' });
    setTimeout(() => {
      onClickSaveButton();
    });
  }, [isActive, onClickSaveButton, reportForm]);

  const trackDiscard = useCallback(() => {
    reportTracker.track(`Discard changes to ${isNewReport ? 'new' : 'existing'} report`);
  }, [isNewReport, reportTracker]);

  const onNavigationContinue = useCallback((shouldSave = false) => {
    if (shouldSave) {
      onSaveReport(false);
    } else {
      if (isAddedReport) {
        onCancelAddedReport?.();
      }
      trackDiscard();
    }
  }, [isAddedReport, onCancelAddedReport, onSaveReport, trackDiscard]);

  const onClickCancelButton = useCallback(() => {
    reportTracker.track('Click "cancel" button');
    if (isAddedReport) {
      navigate(location.pathname);
    } else {
      navigate(`/${TAB_KEYS.REPORTS}`);
    }
  }, [isAddedReport, location.pathname, navigate, reportTracker]);

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
      navigate(redirectTo);
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
    >
    {isSaving && <LoadingOverlay className={styles.loadingOverlay} message="Saving..." />}

    <NavigationPromptModal onContinue={onNavigationContinue} when={shouldShowNavigationPrompt} />

    <Header isReadOnly={isReadOnly} onChangeTitle={onChangeTitle} report={reportForm} onReportChange={onSaveReport}/>

    {saveError && <ErrorMessages errorData={saveError} onClose={onClearErrors} title="Error saving report." />}

    <div className={styles.body}>
      <QuickLinks scrollTopOffset={QUICK_LINKS_SCROLL_TOP_OFFSET}>
        <QuickLinks.NavigationBar>
          <QuickLinks.Anchor anchorTitle="Details" iconComponent={<PencilWritingIcon />} />

          <QuickLinks.Anchor anchorTitle="Activity" iconComponent={<BulletListIcon />} />

          <QuickLinks.Anchor anchorTitle="Links" iconComponent={<LinkIcon />} />

          <QuickLinks.Anchor anchorTitle="History" iconComponent={<HistoryIcon />} />
        </QuickLinks.NavigationBar>

        <div className={styles.content}>
          <QuickLinks.SectionsWrapper>
            <QuickLinks.Section anchorTitle="Details">
              <DetailsSection
                formSchema={reportSchemas?.schema}
                formUISchema={reportSchemas?.uiSchema}
                isCollection={isCollection}
                loadingSchema={!!eventSchemas.loading}
                onFormChange={onFormChange}
                onFormError={onFormError}
                onFormSubmit={onSaveReport}
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
              />
            </QuickLinks.Section>

            {shouldRenderActivitySection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section anchorTitle="Activity" hidden={!shouldRenderActivitySection}>
              <ActivitySection
                attachmentsToAdd={attachmentsToAdd}
                containedReports={containedReports}
                notesToAdd={notesToAdd}
                onDeleteAttachment={onDeleteAttachment}
                onDeleteNote={onDeleteNote}
                onSaveNote={onSaveNote}
                reportAttachments={reportAttachments}
                reportNotes={reportNotes}
                onNoteItemBlur={onNoteItemBlur}
                onNoteItemCancel={onCancelNote}
              />
            </QuickLinks.Section>

            {shouldRenderLinksSection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section anchorTitle="Links" hidden={!shouldRenderLinksSection}>
              <LinksSection linkedPatrols={linkedPatrols} linkedReports={linkedReports} />
            </QuickLinks.Section>

            {shouldRenderHistorySection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section anchorTitle="History" hidden={!shouldRenderHistorySection}>
              <HistorySection reportUpdates={reportForm?.updates || []} />
            </QuickLinks.Section>
          </QuickLinks.SectionsWrapper>

          <div className={styles.footer}>
            <div className={styles.footerActionButtonsContainer}>
              <AddNoteButton className={styles.footerActionButton} onAddNote={onAddNote} />

              <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

              {showAddReportButton && <AddReportButton
                className={styles.footerActionButton}
                onAddReport={onAddReport}
                onSaveAddedReport={onSaveAddedReport}
              />}
            </div>

            <div>
              <Button data-testid='report-details-cancel-btn' className={styles.cancelButton} onClick={onClickCancelButton} type="button" variant="secondary">
                Cancel
              </Button>

              <SplitButton className={styles.saveButton} drop='down' variant='primary' type='button' title='Save' onClick={onClickSaveButton}>
                <Dropdown.Item data-testid='report-details-resolve-btn-toggle'>
                  <Button  type='button' variant='primary' onClick={onClickSaveAndToggleStateButton}>
                    {isActive ? 'Save and resolve' : 'Save and reopen'}
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
  onCancelAddedReport: null,
  reportData: null,
};

ReportDetailView.propTypes = {
  className: PropTypes.string,
  formProps: PropTypes.shape({
    onSaveError: PropTypes.func,
    onSaveSuccess: PropTypes.func,
    relationshipButtonDisabled: PropTypes.bool,
  }),
  isAddedReport: PropTypes.bool,
  isNewReport: PropTypes.bool.isRequired,
  newReportTypeId: PropTypes.string,
  onAddReport: PropTypes.func,
  onSaveAddedReport: PropTypes.func,
  reportData: PropTypes.object,
  reportId: PropTypes.string.isRequired,
};

export default memo(ReportDetailView);
