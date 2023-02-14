import React, { memo } from 'react';
import { connect  } from 'react-redux';
import { calcGpsDisplayString } from '../utils/location';


import { validateLngLat } from '../utils/location';

import Popup from '../Popup';

import styles from './styles.module.scss';

const MouseMarkerPopup = (props) => {
  const { gpsFormat, location, ...rest } = props;
  const popupCoords = location && validateLngLat(location.lng, location.lat) ? [location.lng, location.lat] : null;
  const popupOffset = [-8, 0];
  const popupAnchorPosition = 'right';

  return popupCoords && <Popup className={styles.popup} offset={popupOffset} coordinates={popupCoords} anchor={popupAnchorPosition} {...rest}>
    <p>Click map to place marker.</p>
    <p>
      {popupCoords && calcGpsDisplayString(popupCoords[1], popupCoords[0], gpsFormat)}
    </p>
  </Popup>;
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({ gpsFormat });

export default connect(mapStateToProps, null)(memo(MouseMarkerPopup));