import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { addEventToIncident, createEvent, fetchEvent, setEventState } from '../ducks/events';
import { convertFileListToArray, filterDuplicateUploadFilenames } from '../utils/file';
import {
  createNewIncidentCollection,
  createNewReportForEventType,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  generateErrorListForApiResponseDetails
} from '../utils/events';
import { EVENT_REPORT_CATEGORY, INCIDENT_REPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../utils/save';
import { extractObjectDifference } from '../utils/objects';
import { getCurrentIdFromURL } from '../utils/navigation';
import { getSchemasForEventTypeByEventId } from '../utils/event-schemas';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import ActivitySection from './ActivitySection';
import AddAttachmentButton from './AddAttachmentButton';
import AddNoteButton from './AddNoteButton';
import AddReportButton from './AddReportButton';
import ErrorMessages from '../ErrorMessages';
import Header from './Header';
import LoadingOverlay from '../LoadingOverlay';
import QuickLinks from './QuickLinks';

import styles from './styles.module.scss';

const CLEAR_ERRORS_TIMEOUT = 7000;
const QUICK_LINKS_SCROLL_TOP_OFFSET = 20;

const ReportDetailView = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loadingEvents } = useContext(ReportsTabContext);
  const { navigationData } = useContext(NavigationContext);

  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const eventStore = useSelector((state) => state.data.eventStore);
  const reportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === searchParams.get('reportType'))
  );

  const reportDataTemporalStorage = useRef(null);
  const reportDataToStore = useRef();
  const temporalIdRef = useRef(null);

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [reportForm, setReportForm] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const {
    onSaveError: onSaveErrorCallback,
    onSaveSuccess: onSaveSuccessCallback,
    relationshipButtonDisabled,
  } = navigationData?.formProps || {};
  const reportData = location.state?.reportData;
  const reportTracker = trackEventFactory(reportForm?.is_collection
    ? INCIDENT_REPORT_CATEGORY
    : EVENT_REPORT_CATEGORY);

  const itemId = useMemo(() => getCurrentIdFromURL(location.pathname), [location.pathname]);

  const isNewReport = useMemo(() => itemId === 'new', [itemId]);
  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );
  const originalReport = useMemo(
    () => isNewReport ? newReport : eventStore[itemId],
    [eventStore, isNewReport, itemId, newReport]
  );

  const isPatrolReport = useMemo(() => eventBelongsToPatrol(reportForm), [reportForm]);
  const isCollection = useMemo(() => !!reportForm?.is_collection, [reportForm]);
  const containedReports = useMemo(
    () => reportForm?.contains?.map(({ related_event: report }) => report) || [],
    [reportForm?.contains]
  );
  const isCollectionChild = useMemo(() => eventBelongsToCollection(reportForm), [reportForm]);

  const reportAttachments = useMemo(
    () => Array.isArray(reportForm?.files) ? reportForm.files : [],
    [reportForm?.files]
  );
  const reportNotes = useMemo(() => Array.isArray(reportForm?.notes) ? reportForm.notes : [], [reportForm?.notes]);

  const reportSchemas = useMemo(
    () => reportForm ? getSchemasForEventTypeByEventId(eventSchemas, reportForm.event_type, reportForm.id) : null,
    [eventSchemas, reportForm]
  );

  const reportChanges = useMemo(
    () => extractObjectDifference(reportForm, originalReport),
    [originalReport, reportForm]
  );
  const newNotesAdded = useMemo(
    () => notesToAdd.length > 0 && notesToAdd.some((noteToAdd) => noteToAdd.text),
    [notesToAdd]
  );
  const isReportModified = useMemo(
    () => Object.keys(reportChanges).length > 0 || attachmentsToAdd.length > 0 || newNotesAdded,
    [attachmentsToAdd.length, newNotesAdded, reportChanges]
  );

  const showAddReportButton = useMemo(
    () => !relationshipButtonDisabled && (isCollection || (!isPatrolReport && !isCollectionChild)),
    [isCollection, isCollectionChild, isPatrolReport, relationshipButtonDisabled]
  );

  const onCleanState = useCallback((reportForm = null, temporalId = null) => {
    setAttachmentsToAdd([]);
    setIsSaving(false);
    setNotesToAdd([]);
    setReportForm(reportForm);
    setSaveError(null);
    temporalIdRef.current = temporalId;
  }, []);

  const onClearErrors = useCallback(() => setSaveError(null), []);

  const onSaveSuccess = useCallback((reportToSubmit) => (results) => {
    onSaveSuccessCallback?.(results);

    navigate(`/${TAB_KEYS.REPORTS}`);

    if (reportToSubmit.is_collection && reportToSubmit.state) {
      return Promise.all(reportToSubmit.contains
        .map(contained => contained.related_event.id)
        .map(id => dispatch(setEventState(id, reportToSubmit.state))));
    }
    return results;
  }, [dispatch, navigate, onSaveSuccessCallback]);

  const onSaveError = useCallback((e) => {
    setSaveError(generateErrorListForApiResponseDetails(e));
    onSaveErrorCallback?.(e);
    setTimeout(onClearErrors, CLEAR_ERRORS_TIMEOUT);
  }, [onClearErrors, onSaveErrorCallback]);

  const onSaveReport = useCallback(() => {
    if (isSaving) {
      return;
    }

    reportTracker.track(`Click 'Save' button for ${isNewReport ? 'new' : 'existing'} report`);

    setIsSaving(true);

    let reportToSubmit;
    if (isNewReport) {
      reportToSubmit = reportForm;
    } else {
      reportToSubmit = {
        ...reportChanges,
        id: reportForm.id,
        event_details: { ...originalReport.event_details, ...reportChanges.event_details },
      };

      /* reported_by requires the entire object. bring it over if it's changed and needs updating. */
      if (reportChanges.reported_by) {
        reportToSubmit.reported_by = { ...reportForm.reported_by, ...reportChanges.reported_by };
      }
      /* the API doesn't handle inline PATCHes of notes reliably, so if a note change is detected just bring the whole Array over */
      if (reportChanges.notes) {
        reportToSubmit.notes = reportForm.notes;
      }
      /* the API doesn't handle PATCHes of `contains` prop for incidents */
      if (reportToSubmit.contains) {
        delete reportToSubmit.contains;
      }
    }

    if (reportToSubmit.hasOwnProperty('location') && !reportToSubmit.location) {
      reportToSubmit.location = null;
    }

    const newNotes = notesToAdd.reduce(
      (accumulator, noteToAdd) => noteToAdd.text ? [...accumulator, { text: noteToAdd.text }] : accumulator,
      []
    );
    const newAttachments = attachmentsToAdd.map((attachmentToAdd) => attachmentToAdd.file);
    const saveActions = generateSaveActionsForReportLikeObject(reportToSubmit, 'report', newNotes, newAttachments);
    return executeSaveActions(saveActions)
      .then(onSaveSuccess(reportToSubmit))
      .catch(onSaveError)
      .finally(() => setIsSaving(false));
  }, [
    attachmentsToAdd,
    isNewReport,
    isSaving,
    notesToAdd,
    onSaveError,
    onSaveSuccess,
    originalReport?.event_details,
    reportChanges,
    reportForm,
    reportTracker,
  ]);

  const onChangeTitle = useCallback((newTitle) => setReportForm({ ...reportForm, title: newTitle }), [reportForm]);

  const onDeleteAttachment = useCallback((attachment) => {
    setAttachmentsToAdd(attachmentsToAdd.filter((attachmentToAdd) => attachmentToAdd.file.name !== attachment.name));
  }, [attachmentsToAdd]);

  const onDeleteNote = useCallback((note) => {
    setNotesToAdd(notesToAdd.filter((noteToAdd) => noteToAdd !== note));
  }, [notesToAdd]);

  const onSaveNote = useCallback((originalNote, editedText) => {
    const editedNote = { ...originalNote, text: editedText };

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
  }, [notesToAdd, reportForm, reportNotes]);

  const onAddNote = useCallback(() => {
    const userHasNewNoteEmpty = notesToAdd.some((noteToAdd) => !noteToAdd.text);
    if (userHasNewNoteEmpty) {
      window.alert('Can not add a new note: there\'s an empty note not saved yet');
    } else {
      const newNote = { creationDate: new Date().toISOString(), text: '' };
      setNotesToAdd([...notesToAdd, newNote]);

      reportTracker.track('Added Note');
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
      ...uploadableFiles.map((uploadableFile) => ({ file: uploadableFile, creationDate: new Date().toISOString() })),
    ]);

    reportTracker.track('Added Attachment');
  }, [attachmentsToAdd, reportAttachments, reportTracker]);

  const onAddReport = ([{ data: { data: secondReportSaved } }]) => {
    try {
      onSaveReport().then(async ([{ data: { data: thisReportSaved } }]) => {
        let idOfReportToRedirect;
        if (reportForm.is_collection) {
          await dispatch(addEventToIncident(secondReportSaved.id, thisReportSaved.id));

          ({ data: { data: { id: idOfReportToRedirect } } } = await dispatch(fetchEvent(thisReportSaved.id)));
        } else {
          const { data: { data: incidentCollection } } = await dispatch(createEvent(createNewIncidentCollection()));
          await Promise.all([thisReportSaved.id, secondReportSaved.id]
            .map(id => dispatch(addEventToIncident(id, incidentCollection.id))));
          const incidentCollectionRefreshedResults = await dispatch(fetchEvent(incidentCollection.id));

          ({ data: { data: { id: idOfReportToRedirect } } } = incidentCollectionRefreshedResults);
          onSaveSuccess(incidentCollectionRefreshedResults);
        }

        reportTracker.track('Added Report');

        navigate(`/${TAB_KEYS.REPORTS}/${idOfReportToRedirect}`);
      });
    } catch (e) {
      onSaveError(e);
    }
  };

  const onClickCancelButton = useCallback(() => {
    navigate(relationshipButtonDisabled ? -1 : `/${TAB_KEYS.REPORTS}`);
  }, [navigate, relationshipButtonDisabled]);

  useEffect(() => {
    if (isNewReport && !location.state?.temporalId) {
      navigate(
        `${location.pathname}${location.search}`,
        { replace: true, state: { ...location.state, temporalId: uuid() } }
      );
    }
  }, [isNewReport, location, navigate]);

  useEffect(() => {
    const shouldRedirectToFeed = (isNewReport && !reportType)
      || (!isNewReport && !loadingEvents && !eventStore[itemId]);
    if (shouldRedirectToFeed) {
      navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
    } else if (!loadingEvents) {
      const currentReportId = isNewReport ? location.state?.temporalId : itemId;
      const selectedReportHasChanged = (isNewReport ? temporalIdRef.current : reportForm?.id) !== currentReportId;
      if (selectedReportHasChanged) {
        if (!relationshipButtonDisabled
          && reportDataTemporalStorage.current?.id
          && reportDataTemporalStorage.current.id === currentReportId) {
          setAttachmentsToAdd(reportDataTemporalStorage.current.attachmentsToAdd);
          setNotesToAdd(reportDataTemporalStorage.current.notesToAdd);
          setReportForm({ ...originalReport, ...reportDataTemporalStorage.current.reportChanges });
          temporalIdRef.current = isNewReport ? currentReportId : null;
        } else {
          reportDataTemporalStorage.current = { ...reportDataToStore.current };
          onCleanState(originalReport, isNewReport ? currentReportId : null);
        }
      }
    }
  }, [
    eventStore,
    isNewReport,
    itemId,
    loadingEvents,
    location.state?.temporalId,
    navigate,
    newReport,
    onCleanState,
    originalReport,
    relationshipButtonDisabled,
    reportForm?.id,
    reportType,
  ]);

  useEffect(() => {
    const currentReportId = isNewReport ? temporalIdRef.current : itemId;
    reportDataToStore.current = {
      attachmentsToAdd,
      id: currentReportId,
      notesToAdd: notesToAdd.filter((noteToAdd) => !!noteToAdd.text),
      reportChanges,
    };
  }, [attachmentsToAdd, isNewReport, itemId, notesToAdd, reportChanges]);

  const shouldRenderActivitySection = (reportAttachments.length
    + attachmentsToAdd.length
    + reportNotes.length
    + notesToAdd.length) > 0;
  const shouldRenderHistorySection = !isNewReport;

  return !!reportForm ? <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    {isSaving && <LoadingOverlay message="Saving..." />}

    <Header onChangeTitle={onChangeTitle} report={reportForm || {}} onReportChange={onSaveReport}/>

    {saveError && <ErrorMessages errorData={saveError} onClose={onClearErrors} title="Error saving report." />}

    <div className={styles.body}>
      <QuickLinks scrollTopOffset={QUICK_LINKS_SCROLL_TOP_OFFSET}>
        <QuickLinks.NavigationBar>
          <QuickLinks.Anchor anchorTitle="Details" iconComponent={<PencilWritingIcon />} />

          <QuickLinks.Anchor anchorTitle="Activity" iconComponent={<BulletListIcon />} />

          <QuickLinks.Anchor anchorTitle="History" iconComponent={<HistoryIcon />} />
        </QuickLinks.NavigationBar>

        <div className={styles.content}>
          <QuickLinks.SectionsWrapper>
            <QuickLinks.Section anchorTitle="Details">
              <h3>Details</h3>
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
                reportTracker={reportTracker}
              />
            </QuickLinks.Section>

            {shouldRenderHistorySection && <div className={styles.sectionSeparation} />}

            <QuickLinks.Section anchorTitle="History" hidden={!shouldRenderHistorySection}>
              <h3 data-testid="reportDetailView-historySection">History</h3>
            </QuickLinks.Section>
          </QuickLinks.SectionsWrapper>

          <div className={styles.footer}>
            <div className={styles.footerActionButtonsContainer}>
              <AddNoteButton className={styles.footerActionButton} onAddNote={onAddNote} />

              <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

              {showAddReportButton && <AddReportButton className={styles.footerActionButton} onAddReport={onAddReport} />}
            </div>

            <div>
              <Button className={styles.cancelButton} onClick={onClickCancelButton} type="button" variant="secondary">
                Cancel
              </Button>

              <Button
                className={styles.saveButton}
                disabled={!isReportModified || reportSchemas?.schema?.readonly}
                onClick={onSaveReport}
                type="button"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </QuickLinks>
    </div>
  </div> : null;
};

export default memo(ReportDetailView);
