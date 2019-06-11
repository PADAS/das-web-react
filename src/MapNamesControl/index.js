import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleMapLockState } from '../ducks/map-ui';
import styles from './styles.module.scss';
import { lockMap } from '../utils/map';

const ShowMapName = (props) => {

  const { showMapNames, toggleMapLockState, map } = props;

  const handleClick = (e) => {
    e.preventDefault();
    console.log('Map subject names visibile: ' + !showMapNames);
    toggleMapLockState(!showMapNames);
  };

  useEffect( () => lockMap(map, showMapNames), [showMapNames]);

  return  <span className={props.className || ''}>
            <button title="Show Names" type="button" className={styles.maplock} 
              onClick={handleClick}>{showMapNames ? 'Show Names' : 'Hide Names'}</button>
          </span>;
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
}

export default connect(mapStateToProps, {toggleMapLockState})(MapLockControl);