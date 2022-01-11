import React, { useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import PropTypes from 'prop-types';
import Tab from 'react-bootstrap/Tab';

import { ReactComponent as BulletListIcon } from '../common/images/icons/bullet-list.svg';
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as HistoryIcon } from '../common/images/icons/history.svg';

import { DrawersContext } from '../DrawerProvider';

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

// TODO: Read patrol data from redux
// eslint-disable-next-line no-unused-vars
const PatrolDrawer = ({ patrolId }) => {
  const { hideDrawer } = useContext(DrawersContext);

  return <div data-testid="patrolDrawerContainer">
    <div className={styles.header}>
      Vehicle Patrol
    </div>

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

PatrolDrawer.defaultProps = { patrolId: null };

PatrolDrawer.propTypes = { patrolId: PropTypes.string };

export default PatrolDrawer;
