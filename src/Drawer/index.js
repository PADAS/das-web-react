import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { hideDrawer } from '../ducks/drawer';

import PatrolDrawer from '../PatrolDrawer';

import styles from './styles.module.scss';

export const patrolDrawerId = 'patrol';

const Drawer = ({ drawer, hideDrawer }) => <>
  <div
    className={`${styles.outsideDrawer} ${!!drawer.isOpen ? 'open' : ''}`}
    data-testid="outsideDrawer"
    onClick={() => hideDrawer()}
  />
  <div
    className={`${styles.drawer} ${!!drawer.isOpen ? 'open' : ''} direction-${drawer.direction}`}
    data-testid="drawerContainer"
    >
    {drawer.drawerId === patrolDrawerId && <PatrolDrawer {...drawer.data} />}
  </div>
</>;

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
