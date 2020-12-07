import React, { memo } from 'react';
import { Popup } from 'react-mapbox-gl';

import { validateLngLat } from '../utils/location';

import styles from './styles.module.scss';

const MouseMarkerPopup = (props) => {
  const { location, ...rest } = props;
  const popupCoords = location && validateLngLat(location.lng, location.lat) ? [location.lng, location.lat] : null;
  const popupOffset = [-8, 0];
  const popupAnchorPosition = 'right';

  return popupCoords && <Popup className={styles.popup} offset={popupOffset} coordinates={popupCoords} anchor={popupAnchorPosition} {...rest}>
    <p>Click map to place marker.</p>
  </Popup>;
};

export default memo(MouseMarkerPopup);