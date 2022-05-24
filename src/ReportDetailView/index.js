import React, { useCallback, useEffect, useContext, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { createNewReportForEventType, generateErrorListForApiResponseDetails } from '../utils/events';
import { EVENT_REPORT_CATEGORY, INCIDENT_REPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { getCurrentIdFromURL } from '../utils/navigation';
import { getSchemasForEventTypeByEventId } from '../utils/event-schemas';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { setEventState } from '../ducks/events';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import Header from './Header';

import styles from './styles.module.scss';

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

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

  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [isSaving, setSaveState] = useState(false);
  const [notesToAdd, updateNotesToAdd] = useState([]);
  const [reportForm, setReportForm] = useState(null);
  const [saveError, setSaveErrorState] = useState(null);
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  const { onSaveError, onSaveSuccess } = navigationData?.formProps || {};
  const reportData = location.state?.reportData;

  const itemId = useMemo(() => getCurrentIdFromURL(location.pathname), [location.pathname]);
  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );
  const schemas = useMemo(
    () => reportForm ? getSchemasForEventTypeByEventId(eventSchemas, reportForm.event_type, reportForm.id) : null,
    [eventSchemas, reportForm]
  );

  const typeOfReportToTrack = reportForm?.is_collection ? INCIDENT_REPORT_CATEGORY : EVENT_REPORT_CATEGORY;
  const reportTracker = trackEventFactory(typeOfReportToTrack);

  useEffect(() => {
    const isNewReport = itemId === 'new';
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
  }, [eventStore, loadingEvents, navigationData, navigate, reportForm, itemId, newReport, reportType]);

  const clearErrors = () => setSaveErrorState(null);

  const handleSaveError = useCallback((e) => {
    setSaveState(false);
    setSaveErrorState(generateErrorListForApiResponseDetails(e));
    onSaveError?.(e);
    setTimeout(clearErrors, 7000);
  }, [onSaveError]);

  const onSave = useCallback(() => {
    const reportIsNew = !reportForm.id;
    reportTracker.track(`Click 'Save' button for ${reportIsNew ? 'new' : 'existing'} report`);

    setSaveState(true);

    const reportToSubmit = { ...reportForm };
    if (!reportIsNew && reportToSubmit.contains) {
      delete reportToSubmit.contains;
    }

    if (reportToSubmit.hasOwnProperty('location') && !reportToSubmit.location) {
      reportToSubmit.location = null;
    }

    const actions = generateSaveActionsForReportLikeObject(reportToSubmit, 'report', notesToAdd, filesToUpload);
    return executeSaveActions(actions)
      .then((results) => {
        onSaveSuccess?.(results);

        if (reportToSubmit.is_collection && reportToSubmit.state) {
          return Promise.all(reportToSubmit.contains
            .map(contained => contained.related_event.id)
            .map(id => dispatch(setEventState(id, reportToSubmit.state))));
        }
        return results;
      })
      .catch(handleSaveError)
      .finally(() => {
        setSaveState(false);
        navigate(`/${TAB_KEYS.REPORTS}`);
      });
  }, [dispatch, filesToUpload, handleSaveError, navigate, notesToAdd, onSaveSuccess, reportForm, reportTracker]);

  return !!reportForm ? <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    <Header report={reportForm || {}} setTitle={(value) => setReportForm({ ...reportForm, title: value })} />

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
            <Nav.Link eventKey={NAVIGATION_NOTES_EVENT_KEY}>
              <NoteIcon />
              <span>Notes</span>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_ATTACHMENTS_EVENT_KEY}>
              <AttachmentIcon />
              <span>Attachments</span>
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

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_NOTES_EVENT_KEY}>
              Notes
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_ATTACHMENTS_EVENT_KEY}>
              Attachments
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              History
            </Tab.Pane>
          </Tab.Content>

          <div className={styles.footer}>
            <div>
              <Button className={styles.footerActionButton} onClick={() => {}} type="button" variant="secondary">
                <NoteIcon />
                Note
              </Button>

              <Button className={styles.footerActionButton} onClick={() => {}} type="button" variant="secondary">
                <AttachmentIcon />
                Attachment
              </Button>

              <Button className={styles.footerActionButton} onClick={() => {}} type="button" variant="secondary">
                <HistoryIcon />
                Report
              </Button>
            </div>

            <div>
              {tab === NAVIGATION_DETAILS_EVENT_KEY && <>
                <Button
                  className={styles.cancelButton}
                  onClick={() => navigate(`/${TAB_KEYS.REPORTS}`)}
                  type="button"
                  variant="secondary"
                >
                  Cancel
                </Button>

                {/* This may throw undefined? */}
                {schemas?.schema?.readonly !== true && <Button
                  className={styles.saveButton}
                  onClick={onSave}
                  type="button"
                >
                  Save
                </Button>}
              </>}
            </div>
          </div>
        </div>
      </div>
    </Tab.Container>
  </div> : null;
};

export default ReportDetailView;
