import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import Tooltip from 'react-bootstrap/Tooltip';

import styles from './styles.module.scss';

const TOOLTIP_SHOW_TIME = 400;
const TOOLTIP_HIDE_TIME = 200;

const ItemActionButton = ({ children, onClick, tooltip }) => <OverlayTrigger
  placement="bottom"
  delay={{ show: TOOLTIP_SHOW_TIME, hide: TOOLTIP_HIDE_TIME }}
  overlay={(props) => tooltip ? <Tooltip {...props}>{tooltip}</Tooltip> : <div />}
  >
  <button className={styles.itemActionButton} onClick={onClick}>
    {children}
  </button>
</OverlayTrigger>;

ItemActionButton.defaultProps = {
  onClick: null,
  tooltip: null,
};

ItemActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  tooltip: PropTypes.string,
};

export default ItemActionButton;
