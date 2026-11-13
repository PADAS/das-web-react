import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { hideDrawer } from '../ducks/drawer';

import GlobalMenuDrawer from '../GlobalMenuDrawer';

import * as styles from './styles.module.scss';

export const GLOBAL_MENU_DRAWER_ID = 'global-menu';

const Drawer = () => {
  const dispatch = useDispatch();

  const drawer = useSelector((state) => state.view.drawer);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        dispatch(hideDrawer());
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  return <>
    <div
      className={`${styles.overlay} ${drawer.isOpen ? 'open' : ''}`}
      data-testid="overlay"
      onClick={() => dispatch(hideDrawer())}
    />

    <div
      className={`${styles.drawer} ${drawer.isOpen ? 'open' : ''} direction-${drawer.direction}`}
      data-testid="drawerContainer"
      inert={!drawer.isOpen}
    >
      {drawer.drawerId === GLOBAL_MENU_DRAWER_ID && <GlobalMenuDrawer />}
    </div>
  </>;
};

export default Drawer;
