import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ReactComponent as CloseIcon } from '../common/images/icons/close-icon.svg';

import styles from './styles.module.scss';

const MapLegend = (props) => {
  const { onClose, settingsComponent, titleElement:Title, children, ...rest } = props;
  return <div className={`${styles.legend} ${styles.closedLegend}`} {...rest}>
    {Title}
    <button className={styles.close} onClick={onClose}>
      <CloseIcon />
    </button>
    {settingsComponent && <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
      <Popover className={styles.controlPopover}>
        {settingsComponent}
      </Popover>
    }>
      <button type="button" className={styles.gearButton}></button>
    </OverlayTrigger>}
  </div>;

};

/* 
<div className={`${styles.legend} ${styles.closedLegend}`} {...rest}>
  <Title />
  {children}
  <button className={styles.close} onClick={onClose}>
      <CloseIcon />
    </button>
    {settingsComponent && <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
      <Popover className={styles.controlPopover}>
        {settingsComponent}
      </Popover>
    }>
      <button type="button" className={styles.gearButton}></button>
    </OverlayTrigger>}
</div>

 */

export default memo(MapLegend);


MapLegend.propTypes = {
  titleElement: PropTypes.element.isRequired,
  onClose: PropTypes.func.isRequired,
  settingsComponent: PropTypes.element,
};