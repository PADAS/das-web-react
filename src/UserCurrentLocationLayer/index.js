import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import { point } from '@turf/helpers';

import { imgElFromSrc } from '../utils/img';
import { GEOLOCATOR_OPTIONS } from '../constants';
import { withMap } from '../EarthRangerMap';
import GpsLocationIcon from '../common/images/icons/gps-location-icon.svg';

const UserCurrentLocationLayer = (props) => {
  const { map, onIconClick } = props;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationWatcherID, setLocationWatcherID] = useState(null);
  const [initialized, setInitState] = useState(false);

  const startWatchingPosition = () => {
    return window.navigator.geolocation.watchPosition(setCurrentLocation, onLocationWatchError, GEOLOCATOR_OPTIONS);
  };

  const addImageToMap = async () => {
    if (!map.hasImage('current-location-icon')) {
      const img = await imgElFromSrc(GpsLocationIcon);
      map.addImage('current-location-icon', img);
    }
  }; 

  const onLocationWatchError = (e) => {
    console.log('error watching current location', e);
  };

  const onCurrentLocationIconClick = () => {
    onIconClick(currentLocation);
  };

  useEffect(() => {
    addImageToMap();
    if (!initialized) {
      setInitState(true);
      setLocationWatcherID(startWatchingPosition());
      return () => {
        window.navigator.geolocation.clearWatch(locationWatcherID);
      };
    }
  }, []);

  return currentLocation && <GeoJSONLayer
    data={point([
      currentLocation.coords.longitude,
      currentLocation.coords.latitude,
    ])}
    symbolLayout={{
      'icon-image': 'current-location-icon',
      'icon-allow-overlap': true,
      'icon-anchor': 'center',
      'icon-size': 10,
    }} 
    symbolOnClick={onCurrentLocationIconClick}
  />;
};

export default memo(withMap(UserCurrentLocationLayer));

UserCurrentLocationLayer.defaultProps = {
  onIconClick() {
    
  },
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func,
};
