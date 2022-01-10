import React, { memo } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const VALID_DIRECTIONS = ['left', 'right'];

const Drawer = ({ children, direction, isOpen }) =>
  <div className={`${styles.drawer} ${isOpen && 'open'} direction-${direction}`} data-testid="drawerContainer" >
    {children}
  </div>;

Drawer.defaultProps = { direction: 'right' };

Drawer.propTypes = {
  direction: PropTypes.oneOf(VALID_DIRECTIONS),
  isOpen: PropTypes.bool.isRequired,
};

export default memo(Drawer);
