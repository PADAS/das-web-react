import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { toggleTrackTimepointState } from '../ducks/map-ui';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapTrackTimepointsControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'mapTrackTimepointsControl' });

  const showTrackTimepoints = useSelector((state) => state.view.showTrackTimepoints);

  const handleChange = () => {
    dispatch(toggleTrackTimepointState());

    mapInteractionTracker.track(`${showTrackTimepoints? 'Uncheck' : 'Check'} 'Show Track Timepoints' checkbox`);
  };

  return <label>
    <input
      checked={showTrackTimepoints}
      id="track-timepoints"
      name="track-timepoints"
      onChange={handleChange}
      type="checkbox"
    />

    <span style={{ paddingLeft: '0.4rem' }}>{t('label')}</span>
  </label>;
};

export default MapTrackTimepointsControl;
