import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import { connect } from 'react-redux';
import { toggleMapLockState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';

import { withMap } from '../EarthRangerMap';

import styles from './styles.module.scss';
import { lockMap } from '../utils/map';

const MapLockControl = (props) => {

  const { mapIsLocked, toggleMapLockState, map } = props;

  const handleChange = (e) => {
    toggleMapLockState(!mapIsLocked);

    trackEvent('Map Interaction', 
      `${mapIsLocked? 'Check' : 'Uncheck'} 'Lock Map' checkbox`, null);
  };

  useEffect( () => lockMap(map, mapIsLocked), [mapIsLocked]);

  return <label>
    <input type='checkbox' name='maplock' checked={mapIsLocked} onChange={handleChange}/>
    <span className={styles.cbxlabel}>Lock Map</span>
  </label>;
};

const mapStateToProps = ( {view:{mapIsLocked}} ) => {
  return {mapIsLocked};
};

export default connect(mapStateToProps, {toggleMapLockState})(withMap(MapLockControl));