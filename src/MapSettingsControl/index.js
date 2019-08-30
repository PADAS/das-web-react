import React, { useRef, memo } from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import MapLockControl from '../MapLockControl';
import MapNamesControl from '../MapNamesControl';
import UserLocationMapControl from '../UserLocationMapControl';
import MapTrackTimepointsControl from '../MapTrackTimepointsControl';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { trackEvent } from '../utils/analytics';
import styles from './styles.module.scss';


const MapSettingsControl = (props) => {
  const { hasUserLocation } = props;
  const formRef = useRef(null);

  const popover = (
    <Popover id="settings-popover" className={styles.mapSettings} title="Map Settings">
      <ul>
        <li><MapLockControl /></li>
        <li><MapNamesControl /></li>
        <li><MapTrackTimepointsControl /></li>
        {hasUserLocation && <li><UserLocationMapControl /></li>}
      </ul>
    </Popover>
  );

  const onButtonClick = () => {
    trackEvent('Map Interaction', "Click 'Map Settings' button");
  };

  return <OverlayTrigger trigger="click" placement="top" rootClose={true} overlay={popover}>
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
