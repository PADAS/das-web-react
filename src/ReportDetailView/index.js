import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { convertFileListToArray, filterDuplicateUploadFilenames } from '../utils/file';
import { createNewReportForEventType, generateErrorListForApiResponseDetails } from '../utils/events';
import { EVENT_REPORT_CATEGORY, INCIDENT_REPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { executeSaveActions, generateSaveActionsForReportLikeObject } from '../utils/save';
import { extractObjectDifference } from '../utils/objects';
import { getCurrentIdFromURL } from '../utils/navigation';
import { getSchemasForEventTypeByEventId } from '../utils/event-schemas';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { setEventState } from '../ducks/events';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import ActivitySection from './ActivitySection';
import AddAttachmentButton from './AddAttachmentButton';
import AddNoteButton from './AddNoteButton';
import ErrorMessages from '../ErrorMessages';
import Header from './Header';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_ACTIVITY_EVENT_KEY = 'activity';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const CLEAR_ERRORS_TIMEOUT = 7000;

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

  const [attachmentsToAdd, setAttachmentsToAdd] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notesToAdd, setNotesToAdd] = useState([]);
  const [reportForm, setReportForm] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  const { onSaveError: onSaveErrorCallback, onSaveSuccess: onSaveSuccessCallback } = navigationData?.formProps || {};
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

  const onChangeTitle = useCallback((newTitle) => setReportForm({ ...reportForm, title: newTitle }), [reportForm]);

  const onClearErrors = useCallback(() => setSaveError(null), []);

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

  const onClickCancelButton = useCallback(() => navigate(`/${TAB_KEYS.REPORTS}`), [navigate]);

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

  const onClickSaveButton = useCallback(() => {
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

  useEffect(() => {
    if (isNewReport && !reportType) {
      navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
    }

    if (!loadingEvents) {
      if (!isNewReport && !eventStore[itemId]) {
        return navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
      }

      const idHasChanged = reportForm?.id !== itemId;
      const newReportTypeHasChanged = reportForm?.icon_id !== reportType?.icon_id;
      const selectedReportHasChanged = isNewReport ? newReportTypeHasChanged : idHasChanged;
      if (selectedReportHasChanged) {
        setReportForm(isNewReport ? newReport : eventStore[itemId]);
      }
    }
  }, [eventStore, isNewReport, itemId, loadingEvents, navigationData, navigate, newReport, reportForm, reportType]);

  return !!reportForm ? <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    {isSaving && <LoadingOverlay message="Saving..." />}

    <Header onChangeTitle={onChangeTitle} report={reportForm || {}} />

    {saveError && <ErrorMessages errorData={saveError} onClose={onClearErrors} title="Error saving report." />}

    <Tab.Container activeKey={tab} onSelect={setTab}>
      <div className={styles.body}>
        <Nav className={styles.navigation}>
          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_DETAILS_EVENT_KEY}>
              <PencilWritingIcon />
              <span>Details</span>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_ACTIVITY_EVENT_KEY}>
              <BulletListIcon />
              <span>Activity</span>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              <HistoryIcon />
              <span>History</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <div className={styles.content}>
          <Tab.Content className={styles.tab}>
            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_DETAILS_EVENT_KEY}>
              Details
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_ACTIVITY_EVENT_KEY}>
              <ActivitySection
                attachmentsToAdd={attachmentsToAdd}
                notesToAdd={notesToAdd}
                onDeleteAttachment={onDeleteAttachment}
                onDeleteNote={onDeleteNote}
                onSaveNote={onSaveNote}
                reportAttachments={reportAttachments}
                reportNotes={reportNotes}
                reportTracker={reportTracker}
              />
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              History
            </Tab.Pane>
          </Tab.Content>

          <div className={styles.footer}>
            <div>
              <AddNoteButton className={styles.footerActionButton} onAddNote={onAddNote} />

              <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={onAddAttachments} />

              <Button className={styles.footerActionButton} onClick={() => {}} type="button" variant="secondary">
                <HistoryIcon />
                <label>Report</label>
              </Button>
            </div>

            <div>
              <Button className={styles.cancelButton} onClick={onClickCancelButton} type="button" variant="secondary">
                Cancel
              </Button>

              <Button
                className={styles.saveButton}
                disabled={!isReportModified || reportSchemas?.schema?.readonly}
                onClick={onClickSaveButton}
                type="button"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tab.Container>
  </div> : null;
};

export default memo(ReportDetailView);
