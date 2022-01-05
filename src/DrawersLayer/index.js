import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const DrawersContext = createContext();

// To add a new drawer create its id and add it to the defaultDrawersState
export const patrolDrawerId = 'patrol';

const defaultDrawersState = { [patrolDrawerId]: { data: null, isOpen: false } };

const DrawersLayer = ({ children }) => {
  const [drawers, setDrawers] = useState(defaultDrawersState);

  const hideDrawer = (drawerId) => setDrawers({ ...drawers, [drawerId]: { data: null, isOpen: false } });

  const showDrawer = (drawerId, data = null) => setDrawers({ ...drawers, [drawerId]: { data, isOpen: true } });

  return <DrawersContext.Provider value={{ drawers, hideDrawer, showDrawer }}>
    {children}
  </DrawersContext.Provider>;
};

DrawersLayer.propTypes = { children: PropTypes.node.isRequired };

export default DrawersLayer;
