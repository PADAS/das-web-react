import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

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
import { getReportDataTemporalStorage, setReportDataTemporalStorage } from './reportDataTemporalStorage';
import { getSchemasForEventTypeByEventId } from '../utils/event-schemas';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import ActivitySection from './ActivitySection';
import AddAttachmentButton from './AddAttachmentButton';
import AddNoteButton from './AddNoteButton';
import AddReportButton from './AddReportButton';
import ErrorMessages from '../ErrorMessages';
import Header from './Header';
import LoadingOverlay from '../LoadingOverlay';
import QuickLinkAnchors from './QuickLinkAnchors';

import styles from './styles.module.scss';

const CLEAR_ERRORS_TIMEOUT = 7000;
const OFFSET_TOP_SCROLL_GAP = 20;

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

  const reportDataToStore = useRef();
  const reportFormRef = useRef();

  const [activitySectionElement, setActivitySectionElement] = useState(null);
  const [detailsSectionElement, setDetailsSectionElement] = useState(null);
  const [historySectionElement, setHistorySectionElement] = useState(null);

  const activitySectionRef = useCallback((node) => setActivitySectionElement(node), []);
  const detailsSectionRef = useCallback((node) => setDetailsSectionElement(node), []);
  const historySectionRef = useCallback((node) => setHistorySectionElement(node), []);

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [reportForm, setReportForm] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [temporalId, setTemporalId] = useState(null);

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

  const onScrollToSection = useCallback((sectionElement) => () => {
    reportFormRef.current.scrollTo({ top: sectionElement.offsetTop - OFFSET_TOP_SCROLL_GAP, behavior: 'smooth' });
  }, []);

  const onCleanState = useCallback((reportForm = null, temporalId = null) => {
    setAttachmentsToAdd([]);
    setIsSaving(false);
    setNotesToAdd([]);
    setReportForm(reportForm);
    setSaveError(null);
    setTemporalId(temporalId);
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
    const shouldRedirectToFeed = (isNewReport && !reportType)
      || (!isNewReport && !loadingEvents && !eventStore[itemId]);
    if (shouldRedirectToFeed) {
      navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
    } else if (!loadingEvents) {
      const currentReportId = isNewReport ? searchParams.get('temporalId') : itemId;
      const selectedReportHasChanged = (isNewReport ? temporalId : reportForm?.id) !== currentReportId;
      if (selectedReportHasChanged) {
        const reportDataStored = getReportDataTemporalStorage();
        if (!relationshipButtonDisabled && reportDataStored?.id === currentReportId) {
          setAttachmentsToAdd(reportDataStored.attachmentsToAdd);
          setNotesToAdd(reportDataStored.notesToAdd);
          setReportForm({ ...originalReport, ...reportDataStored.reportChanges });
          setTemporalId(isNewReport ? currentReportId : null);
        } else {
          setReportDataTemporalStorage(reportDataToStore.current);
          onCleanState(originalReport, isNewReport ? currentReportId : null);
        }
      }
    }
  }, [
    eventStore,
    isNewReport,
    itemId,
    loadingEvents,
    navigate,
    newReport,
    onCleanState,
    originalReport,
    relationshipButtonDisabled,
    reportForm?.id,
    reportType,
    searchParams,
    temporalId,
  ]);

  useEffect(() => {
    const currentReportId = isNewReport ? temporalId : itemId;
    reportDataToStore.current = {
      attachmentsToAdd,
      id: currentReportId,
      notesToAdd: notesToAdd.filter((noteToAdd) => !!noteToAdd.text),
      reportChanges,
    };
  }, [attachmentsToAdd, isNewReport, itemId, notesToAdd, reportChanges, temporalId]);

  useEffect(() => () => setReportDataTemporalStorage(null), []);

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
      <QuickLinkAnchors
        activitySectionElement={activitySectionElement}
        detailsSectionElement={detailsSectionElement}
        historySectionElement={historySectionElement}
        onScrollToSection={onScrollToSection}
      />

      <div className={styles.content}>
        <div className={styles.reportForm} ref={reportFormRef}>
          <h3 ref={detailsSectionRef}>Details</h3>

          {shouldRenderActivitySection && <>
            <div className={styles.sectionSeparation} />

            <ActivitySection
              attachmentsToAdd={attachmentsToAdd}
              containedReports={containedReports}
              notesToAdd={notesToAdd}
              onDeleteAttachment={onDeleteAttachment}
              onDeleteNote={onDeleteNote}
              onSaveNote={onSaveNote}
              ref={activitySectionRef}
              reportAttachments={reportAttachments}
              reportNotes={reportNotes}
              reportTracker={reportTracker}
            />
          </>}

          {shouldRenderHistorySection && <>
            <div className={styles.sectionSeparation} />

            <h3 ref={historySectionRef}>History</h3>
          </>}
        </div>

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
    </div>
  </div> : null;
};

export default memo(ReportDetailView);
