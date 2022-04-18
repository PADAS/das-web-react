import React, { useEffect, useState } from 'react';
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
import useURLNavigation from '../hooks/useURLNavigation';

import Header from './Header';

import styles from './styles.module.scss';

const { ENABLE_URL_NAVIGATION } = DEVELOPMENT_FEATURE_FLAGS;

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const ReportDetailView = ({ loadingEvents }) => {
  const dispatch = useDispatch();

  const { localData, navigate, params: urlParams, query: urlQuery } = useURLNavigation();

  const { data: sideBarData } = useSelector((state) => state.view.sideBar);
  const eventStore = useSelector((state) => state.data.eventStore);

  const [reportForm, setReportForm] = useState(null);
  const [formProps, setFormProps] = useState(null);
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  useEffect(() => {
    if (!loadingEvents && reportForm?.id !== urlParams.id) {
      if (ENABLE_URL_NAVIGATION) {
        if (urlParams.id === 'new') {
          setReportForm(createNewReportForEventType(urlQuery.reportType, urlQuery.reportData));
        } else if (eventStore[urlParams.id]) {
          setReportForm(eventStore[urlParams.id]);
        } else {
          navigate(TAB_KEYS.REPORTS);
        }
        setFormProps(localData?.formProps || {});
      } else {
        setFormProps(sideBarData?.formProps || {});
        setReportForm(sideBarData.report);
      }
    }
  }, [eventStore, loadingEvents, localData, navigate, reportForm, sideBarData, urlParams, urlQuery]);

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
