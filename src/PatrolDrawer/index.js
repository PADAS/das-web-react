import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { addPatrolSegmentToEvent } from '../utils/events';
import { createPatrolDataSelector, getPatrolList } from '../selectors/patrols';
import {
  displayPatrolSegmentId,
  displayTitleForPatrol,
  patrolShouldBeMarkedDone,
  patrolShouldBeMarkedOpen,
} from '../utils/patrols';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { hideDrawer } from '../ducks/drawer';
import { PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { PATROL_DRAWER_CATEGORY, trackEventFactory } from '../utils/analytics';

import Header from './Header';
import HistoryTab from './HistoryTab';

import styles from './styles.module.scss';

const patrolDrawerTracker = trackEventFactory(PATROL_DRAWER_CATEGORY);

const NAVIGATION_PLAN_EVENT_KEY = 'plan';
const NAVIGATION_TIMELINE_EVENT_KEY = 'timeline';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

// TODO: unused variables will be useful later
/* eslint-disable no-unused-vars */
const PatrolDrawer = ({ hideDrawer, patrol, leader, patrolPermissions, trackData, startStopGeometries }) => {
  // TODO: test that a user without permissions can't do any update actions once the implementation is finished
  const hasEditPatrolsPermission = patrolPermissions.includes(PERMISSIONS.UPDATE);

  const patrolTrackStatus = !patrol.id ? 'new' : 'existing';

  const [isSaving, setSaveState] = useState(false);
  const [newFiles, updateNewFiles] = useState([]);
  const [newReports, setNewReports] = useState([]);
  const [patrolForm, setPatrolForm] = useState();
  const [tab, setTab] = useState(NAVIGATION_PLAN_EVENT_KEY);

  const isNewPatrol = !patrol.id;

  const patrolSegmentId = useMemo(() => displayPatrolSegmentId(patrol), [patrol]);

  useEffect(() => {
    setPatrolForm({ ...patrol, title: displayTitleForPatrol(patrol, leader) });
  }, [leader, patrol]);

  const onSave = useCallback(() => {
    patrolDrawerTracker.track(`Click "save" button for ${patrolTrackStatus} patrol`);
    setSaveState(true);

    const patrolToSubmit = { ...patrolForm };
    if (patrolShouldBeMarkedDone(patrolForm)){
      patrolToSubmit.state = PATROL_API_STATES.DONE;
    } else if (patrolShouldBeMarkedOpen(patrolForm)) {
      patrolToSubmit.state = PATROL_API_STATES.OPEN;
    }

    ['start_location', 'end_location'].forEach((prop) => {
      if (patrolToSubmit.hasOwnProperty(prop) && !patrolToSubmit[prop]) {
        patrolToSubmit[prop] = null;
      }
    });

    // just assign added newReports to inital segment id for now
    newReports.forEach((report) => addPatrolSegmentToEvent(patrolSegmentId, report.id));

    const actions = generateSaveActionsForReportLikeObject(patrolToSubmit, 'patrol', [], newFiles);
    return executeSaveActions(actions)
      .then(() => {
        patrolDrawerTracker.track(`Saved ${patrolTrackStatus} patrol`);
        hideDrawer();
      })
      .catch((error) => {
        patrolDrawerTracker.track(`Error saving ${patrolTrackStatus} patrol`);
        console.warn('failed to save new patrol', error);
      })
      .finally(() => setSaveState(false));
  }, [hideDrawer, newFiles, newReports, patrolForm, patrolSegmentId, patrolTrackStatus]);

  return !!patrolForm && <div className={styles.patrolDrawer} data-testid="patrolDrawerContainer">
    <Header
      patrol={patrol}
      setTitle={(value) => setPatrolForm({ ...patrolForm, title: value })}
      title={patrolForm.title}
    />

    <Tab.Container activeKey={tab} onSelect={setTab}>
      <div className={styles.body}>
        <Nav className={styles.navigation}>
          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_PLAN_EVENT_KEY}>
              <CalendarIcon />
              <span>Plan</span>
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>
              <BulletListIcon />
              <span>Timeline</span>
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
          <Tab.Content className={`${styles.tab} ${hasEditPatrolsPermission ? '' : 'readonly'}`}>
            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_PLAN_EVENT_KEY}>
              Plan
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>
              Timeline
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              <HistoryTab patrolForm={patrolForm} />
            </Tab.Pane>
          </Tab.Content>

          <div className={styles.footer}>
            <Button className={styles.exitButton} onClick={() => hideDrawer()} type="button" variant="secondary">
              Exit
            </Button>

            {tab === NAVIGATION_PLAN_EVENT_KEY && hasEditPatrolsPermission && <Button
              className={styles.saveButton}
              onClick={onSave}
              type="button"
            >
              Save
            </Button>}
          </div>
        </div>
      </div>
    </Tab.Container>
  </div>;
};

PatrolDrawer.propTypes = {
  hideDrawer: PropTypes.func.isRequired,
  leader: PropTypes.shape({
    name: PropTypes.string,
  }),
  patrol: PropTypes.shape({
    icon_id: PropTypes.string,
    patrol_segments: PropTypes.array,
    serial_number: PropTypes.number,
    title: PropTypes.string,
  }).isRequired,
  patrolPermissions: PropTypes.arrayOf(PropTypes.string).isRequired,
  startStopGeometries: PropTypes.shape({}),
  trackData: PropTypes.shape({}),
};

const mapStateToProps = (state, props) => {
  const patrol = !!props.patrolId
    ? getPatrolList(state).results.find((patrol) => patrol.id === props.patrolId)
    : props.newPatrol;

  const permissionSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;
  const patrolPermissions = permissionSource?.permissions?.[PERMISSION_KEYS.PATROLS] || [];

  return { ...createPatrolDataSelector()(state, { patrol }), patrolPermissions };
};

export default connect(mapStateToProps, { hideDrawer })(PatrolDrawer);
