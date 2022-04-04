import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { hideReportDetailView } from '../ducks/events';

import Header from './Header';

import styles from './styles.module.scss';

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const ReportDetailView = () => {
  const dispatch = useDispatch();

  const { formProps = {}, report } = useSelector((state) => state.view.reportDetailView);
  const {
    navigateRelationships,
    relationshipButtonDisabled,
    onSaveError,
    onSaveSuccess,
    hidePatrols,
  } = formProps;

  const [reportForm, setReportForm] = useState({ ...report });
  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  return <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    <Header
      report={report}
      setTitle={(value) => setReportForm({ ...reportForm, title: value })}
      title={reportForm.title}
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
                  onClick={() => dispatch(hideReportDetailView())}
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
  </div>;
};

export default ReportDetailView;
