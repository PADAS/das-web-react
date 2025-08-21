import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { ReactComponent as TriangleExclamationIcon } from '../common/images/icons/triangle-exclamation.svg';

import * as styles from './styles.module.scss';

export const TYPES = { WARNING: 'WARNING' };

const ICONS = { [TYPES.WARNING]: <TriangleExclamationIcon /> };

const IconTooltip = ({ className, iconButtonAriaLabel, id, placement = 'bottom', title, type = TYPES.WARNING }) => <>
  <OverlayTrigger
      overlay={(props) => <Tooltip {...props} arrowProps={{ style: { display: 'none' } }}>
        {title}
      </Tooltip>}
      placement={placement}
    >
    <button
      aria-hidden
      aria-label={iconButtonAriaLabel}
      className={`${styles.iconButton} ${styles[type.toLowerCase()]} ${className}`}
      type="button"
    >
      {ICONS[type]}
    </button>
  </OverlayTrigger>

  <p className="sr-only" id={id}>
    {title}
  </p>
</>;

export default IconTooltip;
