import React, { useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Drawer from 'react-modern-drawer';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

import { DrawersContext, patrolDrawerId } from '../DrawersLayer';

import styles from './styles.module.scss';

import 'react-modern-drawer/dist/index.css';

const NAVIGATION_PLAN_EVENT_KEY = 'plan';
const NAVIGATION_TIMELINE_EVENT_KEY = 'timeline';
const NAVIGATION_HISTORY_EVENT_KEY = 'history';

const PatrolDrawer = () => {
  const { drawers, hideDrawer } = useContext(DrawersContext);
  const { data, isOpen } = drawers[patrolDrawerId];

  return <Drawer className="drawer" open={isOpen} onClose={() => hideDrawer(patrolDrawerId)} direction='right'>
    <div className={styles.header}>
      Vehicle Patrol
    </div>

    <Tab.Container defaultActiveKey={NAVIGATION_PLAN_EVENT_KEY}>
      <div className={styles.body}>
        <Nav className={styles.navigation}>
          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_PLAN_EVENT_KEY}>Plan</Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_TIMELINE_EVENT_KEY}>Timeline</Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link eventKey={NAVIGATION_HISTORY_EVENT_KEY}>History</Nav.Link>
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
            onClick={() => hideDrawer(patrolDrawerId)}
            type="button"
            variant="secondary"
          >
            Exit
          </Button>
        </div>
      </div>
    </Tab.Container>
  </Drawer>;
};

export default PatrolDrawer;
