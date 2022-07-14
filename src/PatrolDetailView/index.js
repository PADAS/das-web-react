import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect, useSelector } from 'react-redux';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { addPatrolSegmentToEvent } from '../utils/events';
import { createPatrolDataSelector } from '../selectors/patrols';
import {
  createNewPatrolForPatrolType,
  displayPatrolSegmentId,
  displayTitleForPatrol,
  patrolShouldBeMarkedDone,
  patrolShouldBeMarkedOpen,
} from '../utils/patrols';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { getCurrentIdFromURL } from '../utils/navigation';
import { PATROL_API_STATES, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';
import { PATROL_DETAIL_VIEW_CATEGORY, trackEventFactory } from '../utils/analytics';
import { PatrolsTabContext } from '../SideBar/PatrolsTab';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import Header from './Header';
import HistoryTab from './HistoryTab';
import PlanTab from './PlanTab';

import styles from './styles.module.scss';

const patrolDetailViewTracker = trackEventFactory(PATROL_DETAIL_VIEW_CATEGORY);

const NAVIGATION_PLAN_EVENT_KEY = 'plan';
const NAVIGATION_TIMELINE_EVENT_KEY = 'timeline';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

/* eslint-disable no-unused-vars */
const PatrolDetailView = ({ patrolPermissions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loadingPatrols } = useContext(PatrolsTabContext) || {};

  const patrolStore = useSelector((state) => state.data.patrolStore);
  const patrolType = useSelector(
    (state) => state.data.patrolTypes.find((patrolType) => patrolType.id === searchParams.get('patrolType'))
  );

  const state = useSelector((state) => state);

  const temporalIdRef = useRef(null);

  const [patrolDataSelector, setPatrolDataSelector] = useState(null);

  const { patrol, leader, trackData, startStopGeometries } = patrolDataSelector || {};

  const patrolData = location.state?.patrolData;

  const itemId = useMemo(() => getCurrentIdFromURL(location.pathname), [location.pathname]);

  const isNewPatrol = useMemo(() => itemId === 'new', [itemId]);
  const newPatrol = useMemo(
    () => patrolType ? createNewPatrolForPatrolType(patrolType, patrolData) : null,
    [patrolData, patrolType]
  );
  const originalPatrol = useMemo(
    () => isNewPatrol ? newPatrol : patrolStore[itemId],
    [isNewPatrol, itemId, newPatrol, patrolStore]
  );

  // TODO: test that a user without permissions can't do any update actions once the implementation is finished
  const hasEditPatrolsPermission = patrolPermissions.includes(PERMISSIONS.UPDATE);

  const patrolTrackStatus = !patrol?.id ? 'new' : 'existing';

  const [isSaving, setSaveState] = useState(false);
  const [newFiles, updateNewFiles] = useState([]);
  const [newReports, setNewReports] = useState([]);
  const [patrolForm, setPatrolForm] = useState();
  const [tab, setTab] = useState(NAVIGATION_PLAN_EVENT_KEY);

  const patrolSegmentId = useMemo(() => {
    if (patrol) {
      return displayPatrolSegmentId(patrol);
    }
  }, [patrol]);

  const onPatrolChange = useCallback((patrolChanges) => {
    setPatrolForm({ ...patrol, ...patrolChanges });
  }, [patrol]);

  const onSave = useCallback(() => {
    patrolDetailViewTracker.track(`Click "save" button for ${patrolTrackStatus} patrol`);
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
    newReports.forEach((report) => {
      addPatrolSegmentToEvent(patrolSegmentId, report.id);
    });

    const actions = generateSaveActionsForReportLikeObject(patrolToSubmit, 'patrol', [], newFiles);
    return executeSaveActions(actions)
      .then(() => {
        patrolDetailViewTracker.track(`Saved ${patrolTrackStatus} patrol`);
      })
      .catch((error) => {
        patrolDetailViewTracker.track(`Error saving ${patrolTrackStatus} patrol`);
        console.warn('failed to save new patrol', error);
      })
      .finally(() => {
        setSaveState(false);
        navigate(`/${TAB_KEYS.PATROLS}`);
      });
  }, [newFiles, newReports, patrolForm, patrolSegmentId, patrolTrackStatus, navigate]);

  useEffect(() => {
    if (isNewPatrol && !location.state?.temporalId) {
      navigate(
        `${location.pathname}${location.search}`,
        { replace: true, state: { ...location.state, temporalId: uuid() } }
      );
    }
  }, [isNewPatrol, location, navigate]);

  useEffect(() => {
    if (patrol) {
      setPatrolForm({ ...patrol, title: displayTitleForPatrol(patrol, leader) });
    }
  }, [leader, patrol]);

  useEffect(() => {
    const shouldRedirectToFeed = (isNewPatrol && !patrolType)
      || (!isNewPatrol && !loadingPatrols && !patrolStore[itemId]);
    if (shouldRedirectToFeed) {
      navigate(`/${TAB_KEYS.PATROLS}`, { replace: true });
    } else if (!loadingPatrols) {
      const currentPatrolId = isNewPatrol ? location.state?.temporalId : itemId;
      const selectedPatrolHasChanged = (isNewPatrol ? temporalIdRef.current : patrolDataSelector?.patrol?.id) !== currentPatrolId;
      if (selectedPatrolHasChanged) {
        setPatrolDataSelector(originalPatrol ? createPatrolDataSelector()(state, { patrol: originalPatrol }) : {});
        temporalIdRef.current = isNewPatrol ? currentPatrolId : null;
      }
    }
  }, [
    isNewPatrol,
    itemId,
    loadingPatrols,
    location.state?.temporalId,
    navigate,
    originalPatrol,
    patrolDataSelector?.patrol?.id,
    patrolStore,
    patrolType,
    state,
  ]);

  return !!patrolForm && <div className={styles.patrolDetailView}>
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
              <PlanTab patrolForm={patrolForm} onPatrolChange={onPatrolChange}/>
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>
              Timeline
            </Tab.Pane>

            <Tab.Pane className={styles.tabPane} eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              <HistoryTab patrolForm={patrolForm} />
            </Tab.Pane>
          </Tab.Content>

          <div className={styles.footer}>
            <Button
              className={styles.exitButton}
              onClick={() => navigate(`/${TAB_KEYS.PATROLS}`)}
              type="button"
              variant="secondary"
            >
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

PatrolDetailView.propTypes = {
  patrolPermissions: PropTypes.arrayOf(PropTypes.string).isRequired,
  patrolDataSelector: PropTypes.shape({
    leader: PropTypes.shape({
      name: PropTypes.string,
    }),
    patrol: PropTypes.shape({
      icon_id: PropTypes.string,
      patrol_segments: PropTypes.array,
      serial_number: PropTypes.number,
      title: PropTypes.string,
    }).isRequired,
    startStopGeometries: PropTypes.shape({}),
    trackData: PropTypes.shape({}),
  }),
};

const mapStateToProps = (state, props) => {
  const permissionSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;
  const patrolPermissions = permissionSource?.permissions?.[PERMISSION_KEYS.PATROLS] || [];

  return { patrolPermissions };
};

export default connect(mapStateToProps)(PatrolDetailView);
