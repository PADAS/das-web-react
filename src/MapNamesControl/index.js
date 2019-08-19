import React from 'react';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;

  const handleChange = (e) => {
    toggleMapNameState(!showMapNames);

    trackEvent('Map Interaction', 
      `${showMapNames? 'Check' : 'Uncheck'} 'Show Names' checkbox`, null);
  };

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showMapNames} onChange={handleChange}/>
    <span className={styles.cbxlabel}>Show Names </span>
  </label>;
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
};

export default connect(mapStateToProps, {toggleMapNameState})(MapNamesControl);