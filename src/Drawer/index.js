import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { hideDrawer } from '../ducks/drawer';

import GlobalMenuDrawer from '../GlobalMenuDrawer';
import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

const ESC_KEY_CODE = 27;

export const globalMenuDrawerId = 'global-menu';
export const patrolDrawerId = 'patrol';

const Drawer = ({ drawer, hideDrawer }) => {
  useEffect(() => {
    const onKeydown = (event) => {
      if (event.keyCode === ESC_KEY_CODE) {
        hideDrawer();
      }
    };
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.removeEventListener('keydown', onKeydown);
    };
  });

  const drawerRendered = useMemo(() => {
    switch (drawer.drawerId) {
    case patrolDrawerId:
      return <PatrolDrawer {...drawer.data} />;
    case globalMenuDrawerId:
      return <GlobalMenuDrawer />;
    default:
      return null;
    }
  }, [drawer]);

  return <>
    <div
      className={`${styles.overlay} ${!!drawer.isOpen ? 'open' : ''}`}
      data-testid="overlay"
      onClick={() => hideDrawer()}
    />
    <div
      className={`${styles.drawer} ${!!drawer.isOpen ? 'open' : ''} direction-${drawer.direction}`}
      data-testid="drawerContainer"
      >
      {drawerRendered}
    </div>
  </>;
};

Drawer.propTypes = {
  drawer: PropTypes.shape({
    data: PropTypes.any,
    direction: PropTypes.string,
    drawerId: PropTypes.string,
    isOpen: PropTypes.bool,
  }).isRequired,
  hideDrawer: PropTypes.func.isRequired,
};

const mapStateToProps = ({ view: { drawer } }) => ({ drawer });

export default connect(mapStateToProps, { hideDrawer })(Drawer);
