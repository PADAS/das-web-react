import React, { memo } from 'react';
import { connect } from 'react-redux';

import { setTimeSliderState } from '../ducks/timeslider';

import { ReactComponent as TimeSliderIcon } from '../common/images/icons/timeslider-icon.svg';

import styles from './styles.module.scss';

const TimeSliderMapControl = ({ active, dateSet, setTimeSliderState }) => {
  const toggleState = () => setTimeSliderState(!active);
  
  return <button className={styles.mapControl} type="button" onClick={toggleState}>
    <TimeSliderIcon className={`${styles.icon} ${active ? styles.activeIcon : ''} ${dateSet ? styles.warningIcon : ''}`} />
  </button>;
};

const mapStateToProps = ({ view: { timeSliderState: { active, virtualDate } } }) => ({ active, dateSet: !!virtualDate });

export default connect(mapStateToProps, { setTimeSliderState })(memo(TimeSliderMapControl));