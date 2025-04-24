import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as CloseIcon } from '../common/images/icons/close-icon.svg';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapLegend = ({ onClose, renderSettings = null, renderTitle }) => <div className={styles.mapLegend}>
  {renderTitle()}

  <button className={styles.close} onClick={onClose}>
    <CloseIcon />
  </button>

  {renderSettings && <OverlayTrigger
    onEntered={() => mapInteractionTracker.track('Heatmap Settings Clicked')}
    overlay={<Popover className={styles.controlPopover}>
      {renderSettings()}
    </Popover>}
    placement="bottom"
    rootClose
    trigger="click"
  >
    <button className={styles.gearButton} type="button" />
  </OverlayTrigger>}
</div>;

export default MapLegend;
