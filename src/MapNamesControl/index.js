import React from 'react';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;

  const handleClick = (e) => {
    e.preventDefault();
    console.log('Map subject names visibile: ' + !showMapNames);
    toggleMapNameState(!showMapNames);
  };

  return  <span className={props.className || ''}>
            <button title="Show Names" type="button" className={styles.mapnames} 
              onClick={handleClick}>{showMapNames ? 'Show Names' : 'Hide Names'}</button>
          </span>;
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
}

export default connect(mapStateToProps, {toggleMapNameState})(MapNamesControl);