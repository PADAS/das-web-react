import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import { useDispatch } from 'react-redux';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as PencilWritingIcon } from '../common/images/icons/pencil-writing.svg';

import { hideReportDetailView } from '../ducks/events';
// import { REPORT_DETAIL_VIEW_CATEGORY, trackEventFactory } from '../utils/analytics';

import Header from './Header';

import styles from './styles.module.scss';

// const reportDetailViewTracker = trackEventFactory(REPORT_DETAIL_VIEW_CATEGORY);

const NAVIGATION_DETAILS_EVENT_KEY = 'details';
const NAVIGATION_NOTES_EVENT_KEY = 'notes';
const NAVIGATION_ATTACHMENTS_EVENT_KEY = 'attachments';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

/* eslint-disable no-unused-vars */
const ReportDetailView = () => {
  const dispatch = useDispatch();

  const [tab, setTab] = useState(NAVIGATION_DETAILS_EVENT_KEY);

  return <div className={styles.reportDetailView} data-testid="reportDetailViewContainer">
    <Header />

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
              <Button
                className={styles.cancelButton}
                onClick={() => dispatch(hideReportDetailView())}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>

              <Button className={styles.saveButton} onClick={() => {}} type="button">
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tab.Container>
  </div>;
};

ReportDetailView.propTypes = { onCloseDetailView: PropTypes.func.isRequired };

const mapStateToProps = (state, props) => {};

export default connect(mapStateToProps)(ReportDetailView);
