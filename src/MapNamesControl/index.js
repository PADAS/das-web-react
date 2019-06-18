import React from 'react';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;

  const handleChange = (e) => {
    e.preventDefault();
    toggleMapNameState(!showMapNames);
  };

  return <div className={styles.mapnamesChx}>
    <input type='checkbox' name='mapname' defaultChecked={showMapNames} onChange={handleChange}/>
    <label htmlFor='mapname'>'Show Map Names'</label>
    </div>;


};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
}

export default connect(mapStateToProps, {toggleMapNameState})(MapNamesControl);