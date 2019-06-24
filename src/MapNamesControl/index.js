import React from 'react';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;

  const handleChange = (e) => {
    toggleMapNameState(!showMapNames);
  };

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showMapNames} onChange={handleChange}/>
    <span className={styles.cbxlabel}>Show Subject Names </span>
    </label>;
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
}

export default connect(mapStateToProps, {toggleMapNameState})(MapNamesControl);