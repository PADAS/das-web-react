import React, { memo } from 'react';
import { connect } from 'react-redux';

import { setTimeSliderState } from '../ducks/timeslider';

import styles from './styles.module.scss';

const TimeSliderMapControl = ({ active, setTimeSliderState }) => {
  const toggleState = () => setTimeSliderState(!active);
  
  return <button className={styles.mapControl} type="button" onClick={toggleState}>
    {active ? 'Active' : 'Inactive'}
  </button>;
};

const mapStateToProps = ({ view: { timeSliderState: { active } } }) => ({ active });

export default connect(mapStateToProps, { setTimeSliderState })(memo(TimeSliderMapControl));