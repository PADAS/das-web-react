import React, { memo } from 'react';
import { calcGpsDisplayString } from '../utils/location';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { validateLngLat } from '../utils/location';

import Popup from '../Popup';

import styles from './styles.module.scss';

const MouseMarkerPopup = ({ location, ...rest }) => {
  const { t } = useTranslation('map-popups', { keyPrefix: 'mouseMarkerPopup' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  return location && validateLngLat(location.lng, location.lat) && <Popup
      anchor="right"
      className={styles.popup}
      coordinates={[location.lng, location.lat]}
      offset={[-8, 0]}
      {...rest}
    >
    <p>{t('title')}</p>

    <p>{calcGpsDisplayString(location.lat, location.lng, gpsFormat)}</p>
  </Popup>;
};

MouseMarkerPopup.defaultProps = {
  location: null,
};

MouseMarkerPopup.propTypes = {
  location: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default memo(MouseMarkerPopup);
