import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import * as styles from './styles.module.scss';

const TOOLTIP_SHOW_TIME = 400;
const TOOLTIP_HIDE_TIME = 200;

const ItemActionButton = ({ children, onClick = null, tooltip = null, ...restProps }) => <OverlayTrigger
  placement="bottom"
  delay={{ show: TOOLTIP_SHOW_TIME, hide: TOOLTIP_HIDE_TIME }}
  overlay={(props) => tooltip ? <Tooltip {...props}>{tooltip}</Tooltip> : <div />}
  >
  <button className={styles.itemActionButton} onClick={onClick} {...restProps}>
    {children}
  </button>
</OverlayTrigger>;

export default ItemActionButton;
