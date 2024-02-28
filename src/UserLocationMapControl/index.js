import React, { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { toggleDisplayUserLocation } from '../ducks/map-ui';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const UserLocationMapControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'userLocationMapControl' });

  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const handleChange = () => {
    dispatch(toggleDisplayUserLocation());

    mapInteractionTracker.track(`${showUserLocation? 'Uncheck' : 'Check'} 'Show My Current Location' checkbox`);
  };

  return <label>
    <input checked={showUserLocation} id="mapname" name="mapname" onChange={handleChange} type="checkbox" />

    <span style={{ paddingLeft: '.4rem' }}>{t('label')}</span>
  </label>;
};

export default memo(UserLocationMapControl);
