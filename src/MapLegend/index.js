import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Collapsible from 'react-collapsible';

import styles from './styles.module.scss';

const MapLegend = (props) => {
  const { onClose, settingsComponent, titleElement, children, ...rest } = props;
  return <Collapsible
    className={`${styles.legend} ${styles.closedLegend}`}
    openedClassName={styles.legend}
    transitionTime={0.1}
    open={true}
    lazyRender={true}
    trigger={titleElement}
    {...rest}
  >
    <button className={styles.close} onClick={onClose}>close</button>
    {children}
    {settingsComponent && <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
      <Popover className={styles.controlPopover}>
        {settingsComponent}
      </Popover>
    }>
      <button type="button" className={styles.gearButton}></button>
    </OverlayTrigger>}
  </Collapsible>;

};

export default memo(MapLegend);


MapLegend.propTypes = {
  titleElement: PropTypes.element.isRequired,
  onClose: PropTypes.func.isRequired,
  settingsComponent: PropTypes.element,
};