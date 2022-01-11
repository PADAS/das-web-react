import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';

import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

export const DrawersContext = createContext();

export const patrolDrawerId = 'patrol';

const DrawerProvider = ({ children }) => {
  const [drawer, setDrawer] = useState({ data: null, drawerId: null, direction: 'right', isOpen: false });

  const hideDrawer = () => setDrawer({ ...drawer, isOpen: false });

  const showDrawer = (drawerId, data, direction = 'right') => setDrawer({ data, drawerId, direction, isOpen: true });

  return <DrawersContext.Provider value={{ hideDrawer, showDrawer }}>
    {children}

    <div className={`${styles.outsideDrawer} ${!!drawer.isOpen ? 'open' : ''}`} onClick={() => hideDrawer()} />
    <div
      className={`${styles.drawer} ${!!drawer.isOpen ? 'open' : ''} direction-${drawer.direction}`}
      data-testid="drawerContainer"
    >
      {drawer.drawerId === patrolDrawerId && <PatrolDrawer patrolId={drawer.data} />}
    </div>
  </DrawersContext.Provider>;
};

DrawerProvider.propTypes = { children: PropTypes.node.isRequired };

export default DrawerProvider;
