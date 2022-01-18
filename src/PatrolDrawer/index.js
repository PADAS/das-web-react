import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { displayTitleForPatrol } from '../utils/patrols';
import { createPatrolDataSelector, getPatrolList } from '../selectors/patrols';
import { hideDrawer } from '../ducks/drawer';

import Header from './Header';

import styles from './styles.module.scss';

const NAVIGATION_PLAN_EVENT_KEY = 'plan';
const NAVIGATION_TIMELINE_EVENT_KEY = 'timeline';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

// TODO: old patrol modal functionality, this logic will be useful later
// export const openModalForPatrol = (patrol, map, config = {}) => {
//   const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;

//   const state = store.getState();

//   const permissionSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;
//   const patrolPermissions = permissionSource?.permissions?.[PERMISSION_KEYS.PATROLS] || [];

//   const canEdit = patrolPermissions.includes(PERMISSIONS.UPDATE);

//   return store.dispatch(
//     addModal({
//       content: PatrolModal,
//       patrol,
//       map,
//       onSaveSuccess,
//       onSaveError,
//       relationshipButtonDisabled,
//       modalProps: {
//         className: `patrol-form-modal ${canEdit ? '' : 'readonly'}`,
//         // keyboard: false,
//       },
//     }));
// };

// TODO: unused variables will be useful later
// eslint-disable-next-line no-unused-vars
const PatrolDrawer = ({ hideDrawer, patrol, leader, trackData, startStopGeometries }) => {
  const [patrolForm, setPatrolForm] = useState();

  useEffect(() => {
    setPatrolForm({
      ...patrol,
      title: displayTitleForPatrol(patrol, leader)
    });
  }, [leader, patrol]);

  return !!patrolForm && <div className={styles.patrolDrawer} data-testid="patrolDrawerContainer">
    <Header
      patrol={patrol}
      // TODO: Implement functions
      restorePatrol={() => {}}
      startPatrol={() => {}}
      setTitle={(value) => setPatrolForm({ ...patrolForm, title: value })}
      title={patrolForm.title}
    />

    <Tab.Container defaultActiveKey={NAVIGATION_PLAN_EVENT_KEY}>
      <div className={styles.body}>
        <Nav className={styles.navigation}>
          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_PLAN_EVENT_KEY}>
              <CalendarIcon />
              Plan
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>
              <BulletListIcon />
              Timeline
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
              <HistoryIcon />
              History
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content className={styles.content}>
          <Tab.Pane eventKey={NAVIGATION_PLAN_EVENT_KEY}>
            Plan
          </Tab.Pane>

          <Tab.Pane eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>
            Timeline
          </Tab.Pane>

          <Tab.Pane eventKey={NAVIGATION_HISTORY_EVENT_KEY}>
            History
          </Tab.Pane>
        </Tab.Content>

        <div className={styles.footer}>
          <Button
            className={styles.exitButton}
            onClick={() => hideDrawer()}
            type="button"
            variant="secondary"
          >
            Exit
          </Button>
        </div>
      </div>
    </Tab.Container>
  </div>;
};

PatrolDrawer.propTypes = {
  hideDrawer: PropTypes.func.isRequired,
  leader: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  patrol: PropTypes.shape({
    icon_id: PropTypes.string,
    patrol_segments: PropTypes.array,
    serial_number: PropTypes.number,
    title: PropTypes.string,
  }).isRequired,
  startStopGeometries: PropTypes.shape({}).isRequired,
  trackData: PropTypes.shape({}).isRequired,
};

const mapStateToProps = (state, props) => {
  const patrol = !!props.patrolId
    ? getPatrolList(state).results.find((patrol) => patrol.id === props.patrolId)
    : props.newPatrol;

  return createPatrolDataSelector()(state, { patrol });
};

export default connect(mapStateToProps, { hideDrawer })(PatrolDrawer);
