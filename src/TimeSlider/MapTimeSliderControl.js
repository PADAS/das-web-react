import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';

import { setTimeSliderState } from '../ducks/timeslider';

import styles from './styles.module.scss';

const MapTimeSliderControl = ({ active, setTimeSliderState }) => {
  const toggleState = () => setTimeSliderState(!active);
  
  return <button className={styles.mapControl} style={{bottom: '3rem', left: '6rem', position: 'absolute'}} type="button" onClick={toggleState}>
    {active ? 'Active' : 'Inactive'}
  </button>
};

const mapStateToProps = ({ view: { timeSliderState: { active } } }) => ({ active });

export default connect(mapStateToProps, { setTimeSliderState })(memo(MapTimeSliderControl));