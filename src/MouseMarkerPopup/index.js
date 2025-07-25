import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { transformLngLatToLocationType } from '../utils/location';
import { validateLngLat } from '../utils/location';

import Popup from '../Popup';

import * as styles from './styles.module.scss';

const MouseMarkerPopup = ({ location = null, ...rest }) => {
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

    <p>{transformLngLatToLocationType({ latitude: location.lat, longitude: location.lng }, gpsFormat)}</p>
  </Popup>;
};

export default memo(MouseMarkerPopup);
