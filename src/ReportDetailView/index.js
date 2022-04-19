import React, { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { createNewReportForEventType } from '../utils/events';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../constants';
import { hideDetailView } from '../ducks/side-bar';
import { useLocationParameters, useNavigate } from '../hooks/navigation';

import Header from './Header';

import styles from './styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const ReportDetailView = ({ loadingEvents }) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { localData, itemId, query: urlQuery } = useLocationParameters();

  const { data: sideBarData } = useSelector((state) => state.view.sideBar);
  const eventStore = useSelector((state) => state.data.eventStore);

  const [reportForm, setReportForm] = useState(null);
  const [formProps, setFormProps] = useState(null);
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  const newReport = useMemo(
    () => urlQuery.reportType ? createNewReportForEventType(urlQuery.reportType, urlQuery.reportData) : null,
    [urlQuery]
  );

  useEffect(() => {
    if (!loadingEvents && reportForm?.id !== itemId) {
      if (ENABLE_URL_NAVIGATION) {
        if (itemId === 'new') {
          setReportForm(newReport);
        } else if (eventStore[itemId]) {
          setReportForm(eventStore[itemId]);
        } else {
          navigate(TAB_KEYS.REPORTS);
        }
        setFormProps(localData?.formProps || {});
      } else {
        setFormProps(sideBarData?.formProps || {});
        setReportForm(sideBarData.report);
      }
    }
  }, [eventStore, loadingEvents, localData, navigate, reportForm, sideBarData, itemId, newReport]);

  const {
    navigateRelationships,
    relationshipButtonDisabled,
    onSaveError,
    onSaveSuccess,
    hidePatrols,
  } = formProps || {};

  return !!reportForm ? <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    <Header
      report={reportForm || {}}
      setTitle={(value) => setReportForm({ ...reportForm, title: value })}
    />

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
                  onClick={() => ENABLE_URL_NAVIGATION ? navigate(TAB_KEYS.REPORTS) : dispatch(hideDetailView())}
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
