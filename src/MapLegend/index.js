import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ReactComponent as CloseIcon } from '../common/images/icons/close-icon.svg';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapLegend = (props) => {
  const { onClose, settingsComponent, titleElement: Title, ...rest } = props;
  return <div className={`${styles.legend} ${styles.closedLegend}`} {...rest}>
    {Title}
    <button className={styles.close} onClick={onClose}>
      <CloseIcon />
    </button>
    {settingsComponent && <OverlayTrigger trigger="click" rootClose placement='bottom'
      onEntered={() => mapInteractionTracker.track('Heatmap Settings Clicked')}
      overlay={
        <Popover className={styles.controlPopover}>
          {settingsComponent}
        </Popover>
      }>
      <button type="button" className={styles.gearButton}></button>
    </OverlayTrigger>}
  </div>;

};

export default memo(MapLegend);


MapLegend.propTypes = {
  titleElement: PropTypes.element.isRequired,
  onClose: PropTypes.func.isRequired,
  settingsComponent: PropTypes.element,
};