import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleMapLockState } from '../ducks/map-ui';
import styles from './styles.module.scss';
import { lockMap } from '../utils/map';

const MapLockControl = (props) => {

  const { mapIsLocked, toggleMapLockState, map } = props;
  const className = mapIsLocked ? 'map-lock' : 'map-unlock';

  const handleChange = (e) => {
    console.log('Toggle map lock state to ' + !mapIsLocked);
    toggleMapLockState(!mapIsLocked);
  };

  useEffect( () => lockMap(map, mapIsLocked), [mapIsLocked]);

  return <div class>
    <input type='checkbox' name='maplock' defaultChecked={mapIsLocked} onChange={handleChange}/>
    <label htmlFor='maplock'>Lock map movement</label>
    </div>;
};

const mapStateToProps = ( {view:{mapIsLocked}} ) => {
  return {mapIsLocked};
}

export default connect(mapStateToProps, {toggleMapLockState})(MapLockControl);