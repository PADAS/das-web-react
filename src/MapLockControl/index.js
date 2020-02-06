import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleMapLockState } from '../ducks/map-ui';
import { withMap } from '../EarthRangerMap';
import { lockMap } from '../utils/map';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const MapLockControl = (props) => {

  const { mapIsLocked, toggleMapLockState, map } = props;

  const onCheckboxChange = (e) => {
    toggleMapLockState(!mapIsLocked);
    trackEvent('Map Interaction',  `${mapIsLocked? 'Uncheck' : 'Check'} 'Lock Map' checkbox`);
  };

  useEffect(() => { 
    lockMap(map, mapIsLocked); 
  }, [mapIsLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  return <label>
    <input type='checkbox' name='maplock' checked={mapIsLocked} onChange={onCheckboxChange}/>
    <span className={styles.cbxlabel}>Lock Map</span>
  </label>;
};

const mapStateToProps = ( {view:{mapIsLocked}} ) => {
  return {mapIsLocked};
};

export default connect(mapStateToProps, {toggleMapLockState})(withMap(MapLockControl));