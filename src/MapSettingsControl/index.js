import React, { memo, useCallback, useRef } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';

import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import ClusterMemberControl from './ClusterMemberControl';
import InactiveRadioControl from '../InactiveRadioControl';
import Map3DToggleControl from './Map3DToggleControl';
import MapDataZoomSimplificationControl from '../MapDataZoomSimplificationControl';
import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import MapTrackTimepointsControl from '../MapTrackTimepointsControl';
import UserLocationMapControl from '../UserLocationMapControl';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapSettingsControl = () => {
  const hasUserLocation = useSelector((state) => !!state.view.userLocation);

  const formRef = useRef(null);

  const popover = (
    <Popover id="settings-popover" title="Map Settings">
      <Popover.Body>
        <ul className={styles.mapSettingsList}>
          <li><MapLockControl /></li>
          <li><MapNamesControl /></li>
          <li><MapTrackTimepointsControl /></li>
          <li><InactiveRadioControl /></li>
          <li><ClusterMemberControl /></li>
          <li><MapDataZoomSimplificationControl /></li>
          <li><Map3DToggleControl /></li>
          {hasUserLocation && <li><UserLocationMapControl /></li>}
        </ul>
      </Popover.Body>
    </Popover>
  );

  const onButtonClick = useCallback(() => {
    mapInteractionTracker.track('Clicked Map Settings button');
  }, []);

  return <OverlayTrigger overlay={popover} placement='left' rootClose trigger="click">
    <button className={styles.gearButton} onClick={onButtonClick} ref={formRef} type='button'>
      <GearIcon />
    </button>
  </OverlayTrigger>;
};

export default memo(MapSettingsControl);
