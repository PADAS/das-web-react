import React from 'react';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

  const handleChange = () => {
    toggleMapNameState(!showMapNames);

    mapInteractionTracker.track(`${showMapNames? 'Uncheck' : 'Check'} 'Show Names' checkbox`);
  };

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showMapNames} onChange={handleChange}/>
    <span className={styles.cbxlabel}>Show Names </span>
  </label>;
};

const mapStateToProps = ( { view: { showMapNames } } ) => {
  return { showMapNames };
};

export default connect(mapStateToProps, { toggleMapNameState })(MapNamesControl);