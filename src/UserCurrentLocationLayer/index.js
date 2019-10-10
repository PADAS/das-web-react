import React, { memo, Fragment, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Source, Layer } from 'react-mapbox-gl';
import { point } from '@turf/helpers';

import { setCurrentUserLocation } from '../ducks/location';
import { userLocationCanBeShown } from '../selectors/index';

import { addMapImage } from '../utils/map';
import { GEOLOCATOR_OPTIONS } from '../constants';
import { withMap } from '../EarthRangerMap';
import GpsLocationIcon from '../common/images/icons/gps-location-icon-blue.svg';

const framesPerSecond = 20;
const initialOpacity = 1;
const initialRadius = 12;
const initialStrokeWidth = 2;
const maxRadius = 18;

const symbolLayout = {
  'icon-image': 'current-location-icon',
  'icon-allow-overlap': true,
  'icon-anchor': 'center',
  'icon-size': 0.6,
};


const UserCurrentLocationLayer = (props) => {
  const { currentBaseLayer, map, onIconClick, setCurrentUserLocation, userLocationCanBeShown, userLocation } = props;
  const [locationWatcherID, setLocationWatcherID] = useState(null);
  const [initialized, setInitState] = useState(false);
  const animationFrameID = useRef(null);
  const [animationState, setAnimationState] = useState({
    opacity: initialOpacity,
    radius: initialRadius,
    strokeWidth: initialStrokeWidth,
  });

  const updateBlipAnimation = (animationState) => {
    setTimeout(() => {
      const radius = animationState.radius + ((maxRadius - animationState.radius) / framesPerSecond);
      const opacity = animationState.opacity - .05;
      const strokeWidth = animationState.strokeWidth - .05;
      if (opacity <= 0) {
        setAnimationState({
          radius: initialRadius, opacity: initialOpacity, strokeWidth: initialStrokeWidth,
        });
      } else {
        setAnimationState({
          radius, opacity, strokeWidth,
        });
      }
    }, 1000 / framesPerSecond);
  };

  const blipAnimation = useRef(updateBlipAnimation);


  const startWatchingPosition = () => {
    return window.navigator.geolocation.watchPosition(setCurrentUserLocation, onLocationWatchError, GEOLOCATOR_OPTIONS);
  };


  const addImageToMap = async () => {
    if (!map.hasImage('current-location-icon')) {
      addMapImage(map, 'current-location-icon', GpsLocationIcon);
    }
  };

  const onLocationWatchError = (e) => {
    console.log('error watching current location', e);
  };

  const onCurrentLocationIconClick = () => {
    onIconClick(userLocation);
  };

  useEffect(() => {
    if (!initialized) {
      setInitState(true);
      setLocationWatcherID(startWatchingPosition());
      return () => {
        window.navigator.geolocation.clearWatch(locationWatcherID);
        window.cancelAnimationFrame(animationFrameID.current);
      };
    }
  }, []);

  useEffect(() => {
    userLocation && blipAnimation.current(animationState);
  }, [userLocation]);

  useEffect(() => {
    setTimeout(addImageToMap);
  }, [currentBaseLayer]);

  useEffect(() => {
    animationFrameID.current = window.requestAnimationFrame(() => blipAnimation.current(animationState));
  }, [animationState]);

  const sourceData = userLocationCanBeShown && {
    type: 'geojson',
    data: point([
      userLocation.coords.longitude,
      userLocation.coords.latitude,
    ]),
  };


  return userLocationCanBeShown && <Fragment>
    <Source id='current-user-location' geoJsonSource={sourceData} />
    <Layer sourceId='current-user-location' layout={symbolLayout} onClick={onCurrentLocationIconClick} type="symbol" />
    <Layer sourceId='current-user-location' paint={{
      'circle-radius': animationState.radius,
      'circle-radius-transition': { duration: 0 },
      'circle-opacity-transition': { duration: 0 },
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': '#007cbf',
      'circle-stroke-width': animationState.strokeWidth,
      'circle-stroke-opacity': animationState.opacity,
    }} type="circle" />
  </Fragment>;
};

const mapStateToProps = (state) => ({
  currentBaseLayer: state.view.currentBaseLayer,
  userLocation: state.view.userLocation,
  userLocationCanBeShown: userLocationCanBeShown(state),
});
export default connect(mapStateToProps, { setCurrentUserLocation })(withMap(memo(UserCurrentLocationLayer)));

UserCurrentLocationLayer.defaultProps = {
  onIconClick() {

  },
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func,
};
