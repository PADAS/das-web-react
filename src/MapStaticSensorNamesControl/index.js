import React from 'react';
import { connect } from 'react-redux';
import { toggleMapStaticSubjectsNameState } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import styles from './styles.module.scss';

const MapStaticSensorNamesControl = (props) => {

  const { showMapStaticSubjectsNames, toggleMapStaticSubjectsNameState } = props;
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

  const handleChange = () => {
    toggleMapStaticSubjectsNameState(!showMapStaticSubjectsNames);

    mapInteractionTracker.track(`${showMapStaticSubjectsNames? 'Uncheck' : 'Check'} 'Show Static Sensor Names' checkbox`);
  };

  return <label>
    <input type='checkbox' checked={showMapStaticSubjectsNames} onChange={handleChange}/>
    <span className={styles.controlLabel}> Show Static Sensor Names </span>
  </label>;
};

const mapStateToProps = ( { view: { showMapStaticSubjectsNames } } ) => {
  return { showMapStaticSubjectsNames };
};

export default connect(mapStateToProps, { toggleMapStaticSubjectsNameState })(MapStaticSensorNamesControl);