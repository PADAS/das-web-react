import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleMapLockState } from '../ducks/map-ui';
import styles from './styles.module.scss';
import { lockMap } from '../utils/map';

const MapLockControl = (props) => {

  const { mapIsLocked, toggleMapLockState, map } = props;
  const className = mapIsLocked ? 'map-lock' : 'map-unlock';
  const hoverText = mapIsLocked ? 'Unlock Map' : 'Lock Map';

  const handleClick = (e) => {
    e.preventDefault();
    console.log('Toggle map lock state to ' + !mapIsLocked);
    toggleMapLockState(!mapIsLocked);
  };

  useEffect( () => lockMap(map, mapIsLocked), [mapIsLocked]);

  return  <span className={className || ''}>
            <button title={hoverText} type="button" className={styles.maplock} 
              onClick={handleClick}></button>
          </span>;
};

const mapStateToProps = ( {view:{mapIsLocked}} ) => {
  return {mapIsLocked};
}

export default connect(mapStateToProps, {toggleMapLockState})(MapLockControl);