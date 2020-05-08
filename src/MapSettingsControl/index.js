import React, { useRef, memo } from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import UserLocationMapControl from '../UserLocationMapControl';
import MapDataZoomSimplificationControl from '../MapDataZoomSimplificationControl';
import MapTrackTimepointsControl from '../MapTrackTimepointsControl';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { trackEvent } from '../utils/analytics';
import styles from './styles.module.scss';
import InactiveRadioControl from '../InactiveRadioControl';


const MapSettingsControl = (props) => {
  const { hasUserLocation } = props;
  const formRef = useRef(null);

  const popover = (
    <Popover id="settings-popover" className={styles.mapSettings} title="Map Settings">
      <Popover.Content>
        <ul>
          <li><MapLockControl /></li>
          <li><MapNamesControl /></li>
          <li><MapTrackTimepointsControl /></li>
          <li><InactiveRadioControl /></li>
          <li><MapDataZoomSimplificationControl /></li>
          {hasUserLocation && <li><UserLocationMapControl /></li>}
        </ul>
      </Popover.Content>
    </Popover>
  );

  const onButtonClick = () => {
    trackEvent('Map Interaction', 'Clicked Map Settings button');
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
