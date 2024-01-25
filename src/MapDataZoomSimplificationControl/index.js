import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { toggleMapDataSimplificationOnZoom } from '../ducks/map-ui';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapDataZoomSimplificationControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'mapDataZoomSimplificationControl' });

  const simplifyMapDataOnZoom = useSelector((state) => state.view.simplifyMapDataOnZoom);

  const label = t('label');

  const handleChange = () => {
    dispatch(toggleMapDataSimplificationOnZoom());

    mapInteractionTracker.track(`${simplifyMapDataOnZoom.enabled? 'Uncheck' : 'Check'} '${label}' checkbox`);
  };

  return <label>
    <input
      checked={simplifyMapDataOnZoom.enabled}
      id="map-data-overlap-when-zoomed"
      name="map-data-overlap-when-zoomed"
      onChange={handleChange}
      type="checkbox"
    />

    <span style={{ paddingLeft: '0.4rem' }} >{label}</span>
  </label>;
};

export default MapDataZoomSimplificationControl;
