import React, { useRef, memo } from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import UserLocationMapControl from '../UserLocationMapControl';
import MapDataZoomSimplificationControl from '../MapDataZoomSimplificationControl';
import MapTrackTimepointsControl from '../MapTrackTimepointsControl';
import Map3DToggleControl from './Map3DToggleControl';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import styles from './styles.module.scss';
import InactiveRadioControl from '../InactiveRadioControl';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapSettingsControl = (props) => {
  const { hasUserLocation } = props;
  const formRef = useRef(null);

  const popover = (
    <Popover id="settings-popover" title="Map Settings">
      <Popover.Content>
        <ul className={styles.mapSettingsList}>
          <li><MapLockControl /></li>
          <li><MapNamesControl /></li>
          <li><MapTrackTimepointsControl /></li>
          <li><InactiveRadioControl /></li>
          <li><MapDataZoomSimplificationControl /></li>
          <li><Map3DToggleControl /></li>
          {hasUserLocation && <li><UserLocationMapControl /></li>}
        </ul>
      </Popover.Content>
    </Popover>
  );

  const onButtonClick = () => {
    mapInteractionTracker.track('Clicked Map Settings button');
  };

  return <OverlayTrigger trigger="click" placement="right" rootClose={true} overlay={popover}>
    <button type='button' className={styles.gearButton} ref={formRef}
      onClick={onButtonClick}>
      <GearIcon />
    </button>
  </OverlayTrigger>;
};

const mapStateToProps = ({ view: { userLocation } }) => ({
  hasUserLocation: !!userLocation,
});

export default connect(mapStateToProps, null)(memo(MapSettingsControl));
