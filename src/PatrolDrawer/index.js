import React, { useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Drawer from 'react-modern-drawer';

import { DrawersContext, patrolDrawerId } from '../DrawersLayer';

import styles from './styles.module.scss';

import 'react-modern-drawer/dist/index.css';

const PatrolDrawer = () => {
  const { drawers, hideDrawer } = useContext(DrawersContext);
  const { data, isOpen } = drawers[patrolDrawerId];

  // TODO: Usar https://react-bootstrap.github.io/components/tabs/#custom-tab-layout para las tabs

  return <Drawer className="drawer" open={isOpen} onClose={() => hideDrawer(patrolDrawerId)} direction='right'>
    <div className={styles.header}>
      Vehicle Patrol
    </div>

    <div className={styles.body}>
      <div className={styles.navigation}></div>

      <div className={styles.content}></div>

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
  </Drawer>;
};

export default PatrolDrawer;
