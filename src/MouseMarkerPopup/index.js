import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import useStringifyCoordinates from '../hooks/useStringifyCoordinates';

import Popup from '../Popup';

import * as styles from './styles.module.scss';

const MouseMarkerPopup = ({ location = null, ...rest }) => {
  const { t } = useTranslation('map-popups', { keyPrefix: 'mouseMarkerPopup' });

  const { coordinatesString, outsideRepresentationBbox } = useStringifyCoordinates({
    latitude: location.lat,
    longitude: location.lng,
  });

  return coordinatesString && <Popup
      anchor="right"
      className={styles.popup}
      coordinates={[location.lng, location.lat]}
      offset={[-8, 0]}
      {...rest}
    >
    <p>{t('title')}</p>

    <p>{outsideRepresentationBbox ? t('coordinatesStringOutsideBbox') : coordinatesString}</p>
  </Popup>;
};

export default memo(MouseMarkerPopup);
