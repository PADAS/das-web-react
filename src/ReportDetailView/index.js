import React, { useEffect, useContext, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { createNewReportForEventType } from '../utils/events';
import { TAB_KEYS } from '../constants';
import { getCurrentIdFromURL } from '../utils/navigation';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import useNavigate from '../hooks/useNavigate';

import Header from './Header';

import styles from './styles.module.scss';

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const ReportDetailView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loadingEvents } = useContext(ReportsTabContext);
  const { navigationData } = useContext(NavigationContext);

  const eventStore = useSelector((state) => state.data.eventStore);
  const reportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === searchParams.get('reportType'))
  );

  const [reportForm, setReportForm] = useState(null);
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  const formProps = navigationData?.formProps;
  const reportData = location.state?.reportData;

  const itemId = useMemo(() => getCurrentIdFromURL(location.pathname), [location.pathname]);
  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );

  useEffect(() => {
    const isNewReport = itemId === 'new';
    if (isNewReport && !reportType) {
      navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
    }

    if (!loadingEvents) {
      if (!isNewReport && !eventStore[itemId]) {
        return navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
      }

      const newReportTypeHasChanged = reportForm?.icon_id !== reportType?.icon_id;
      if (!isNewReport || newReportTypeHasChanged) {
        setReportForm(isNewReport ? newReport : eventStore[itemId]);
      }
    }
  }, [eventStore, loadingEvents, navigationData, navigate, reportForm, itemId, newReport, reportType]);

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

                <Button
                  className={styles.saveButton}
                  onClick={() => {}}
                  type="button"
                >
                  Save
                </Button>
              </>}
            </div>
          </div>
        </div>
      </div>
    </Tab.Container>
  </div> : null;
};

export default ReportDetailView;
