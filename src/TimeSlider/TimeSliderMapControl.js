import React, { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TimeSliderIcon } from '../common/images/icons/timeslider-icon.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { setTimeSliderState } from '../ducks/timeslider';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const TimeSliderMapControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'timeSlider.timeSliderMapControl' });

  const active = useSelector((state) => state.view.timeSliderState.active);
  const dateSet = useSelector((state) => !!state.view.timeSliderState.virtualDate);

  const toggleState = () => {
    dispatch(setTimeSliderState(!active));

    mapInteractionTracker.track(`${!active ? 'Open' : 'Close'} 'Time Slider' control`);
  };

  return <button className={styles.mapControl} onClick={toggleState} type="button">
    <TimeSliderIcon
      className={`${styles.icon} ${active ? styles.activeIcon : ''} ${dateSet ? styles.warningIcon : ''}`}
      title={t('iconTitle')}
    />
  </button>;
};

export default memo(TimeSliderMapControl);
