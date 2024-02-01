import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { hideDrawer } from '../ducks/drawer';

import GlobalMenuDrawer from '../GlobalMenuDrawer';

import styles from './styles.module.scss';

const ESC_KEY_CODE = 27;

export const globalMenuDrawerId = 'global-menu';

const Drawer = () => {
  const dispatch = useDispatch();

  const drawer = useSelector((state) => state.view.drawer);

  useEffect(() => {
    const onKeydown = (event) => {
      if (event.keyCode === ESC_KEY_CODE) {
        dispatch(hideDrawer());
      }
    };

    document.addEventListener('keydown', onKeydown);

    return () => {
      document.removeEventListener('keydown', onKeydown);
    };
  });

  const drawerRendered = drawer.drawerId === globalMenuDrawerId ? <GlobalMenuDrawer /> : null;

  return <>
    <div
      className={`${styles.overlay} ${!!drawer.isOpen ? 'open' : ''}`}
      data-testid="overlay"
      onClick={() => dispatch(hideDrawer())}
    />

    <div
      className={`${styles.drawer} ${!!drawer.isOpen ? 'open' : ''} direction-${drawer.direction}`}
      data-testid="drawerContainer"
      >
      {drawerRendered}
    </div>
  </>;
};

export default Drawer;
