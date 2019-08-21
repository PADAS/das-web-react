import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import styles from './styles.module.scss';

const MapLegend = (props) => {
  const { collapsed, onClose, collapsedTitleElement, settingsComponent, children, ...rest } = props;
  return (
    <div className={styles.legend} {...rest}>
      <button className={styles.close} onClick={onClose}>close</button>
      {collapsed && collapsedTitleElement}
      {children}
      {settingsComponent && <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
        <Popover className={styles.controlPopover}>
          {settingsComponent}
        </Popover>
      }>
        <button type="button" className={styles.gearButton}></button>
      </OverlayTrigger>}
    </div>
  );
};

export default memo(MapLegend);

MapLegend.defaultProps = {
  collapsed: false,
};

MapLegend.propTypes = {
  collapsed: PropTypes.bool,
  collapsedTitleElement: PropTypes.element.isRequired,
  onClose: PropTypes.func.isRequired,
  settingsComponent: PropTypes.element,
};