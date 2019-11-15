import React, { memo, Fragment, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Source, Layer } from 'react-mapbox-gl';
import { point } from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';

import { setCurrentUserLocation } from '../ducks/location';
import { userLocationCanBeShown, bboxBoundsPolygon } from '../selectors';

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
  const { currentMapBbox, map, onIconClick, setCurrentUserLocation, userLocationCanBeShown, onLocationPermissionDenied, userLocation, onlyShowInViewBounds } = props;
  const [locationWatcherID, setLocationWatcherID] = useState(null);
  const[userLocationIsInMapBounds, setUserLocationWithinMapBounds] = useState(false);
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


  const addImageToMap = () => {
    if (!map.hasImage('current-location-icon')) {
      addMapImage(map, 'current-location-icon', GpsLocationIcon);
    }
  };

  const onLocationWatchError = (e) => {
    if (e.code === e.PERMISSION_DENIED) {
      onLocationPermissionDenied && onLocationPermissionDenied(e);
    }
  };

  const onCurrentLocationIconClick = () => {
    onIconClick(userLocation);
  };

  useEffect(() => {
    if (!initialized) {
      addImageToMap();
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
    animationFrameID.current = window.requestAnimationFrame(() => blipAnimation.current(animationState));
    return () => {
      !!animationFrameID && !!animationFrameID.current && window.cancelAnimationFrame(animationFrameID.current);
    };
  }, [animationState]);

  useEffect(() => {
    setUserLocationWithinMapBounds(
      !!currentMapBbox && !!userLocation && !!userLocation.coords && booleanContains(currentMapBbox, point([userLocation.coords.longitude, userLocation.coords.latitude])),
    );
  }, [currentMapBbox, userLocation]);

  const showLayer = onlyShowInViewBounds ? (userLocationCanBeShown && userLocationIsInMapBounds) : userLocationCanBeShown;

  const sourceData = showLayer && {
    type: 'geojson',
    data: point([
      userLocation.coords.longitude,
      userLocation.coords.latitude,
    ]),
  };
  


  return showLayer && <Fragment>
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
  currentMapBbox: bboxBoundsPolygon(state),
  userLocation: state.view.userLocation,
  userLocationCanBeShown: userLocationCanBeShown(state),
});
export default connect(mapStateToProps, { setCurrentUserLocation })(withMap(memo(UserCurrentLocationLayer)));

UserCurrentLocationLayer.defaultProps = {
  onIconClick() {

  },
  onlyShowInViewBounds: true,
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func,
  onlyShowInViewBounds: PropTypes.bool,
  onLocationPermissionDenied: PropTypes.func,
};
