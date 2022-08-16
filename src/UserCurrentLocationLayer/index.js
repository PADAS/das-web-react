import React, { memo, useCallback, useMemo, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { point } from '@turf/helpers';
import booleanContains from '@turf/boolean-contains';

import { userLocationCanBeShown, bboxBoundsPolygon } from '../selectors';

import { addMapImage } from '../utils/map';
import { MAP_ICON_SCALE, SOURCE_IDS } from '../constants';
import { withMap } from '../EarthRangerMap';
import GpsLocationIcon from '../common/images/icons/gps-location-icon-blue.svg';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { CURRENT_USER_LOCATION_SOURCE } = SOURCE_IDS;

const ICON_LAYER_ID = 'current-user-location-icon-layer';
const CIRCLE_LAYER_ID = 'current-user-location-circle-layer';

const framesPerSecond = 20;
const initialOpacity = 1;
const initialRadius = 12;
const initialStrokeWidth = 2;
const maxRadius = 18;

const symbolLayout = {
  'icon-image': 'current-location-icon',
  'icon-allow-overlap': true,
  'icon-anchor': 'center',
  'icon-size': 0.6 / MAP_ICON_SCALE,
};

const updateBlipAnimation = (animationState, setAnimationState) => {
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

const UserCurrentLocationLayer = (props) => {
  const { currentMapBbox, map, onIconClick, userLocationCanBeShown, userLocation } = props;

  const animationFrameID = useRef(null);

  const [animationState, setAnimationState] = useState({
    opacity: initialOpacity,
    radius: initialRadius,
    strokeWidth: initialStrokeWidth,
  });

  const onCurrentLocationIconClick = useCallback(() => {
    onIconClick(userLocation);
  }, [onIconClick, userLocation]);

  useEffect(() => {
    if (map && !map.hasImage('current-location-icon')) {
      addMapImage({ src: GpsLocationIcon, id: 'current-location-icon' });
    }
  }, [map]);

  const userLocationIsInMapBounds = useMemo(() => {
    return !!currentMapBbox
    && !!userLocation
    && !!userLocation.coords
    && booleanContains(currentMapBbox, point([userLocation.coords.longitude, userLocation.coords.latitude]));
  }, [currentMapBbox, userLocation]);

  const showLayer = userLocationCanBeShown && userLocationIsInMapBounds;

  useEffect(() => {
    if (showLayer) {
      animationFrameID.current = window.requestAnimationFrame(() => updateBlipAnimation(animationState, setAnimationState));
    }
    return () => {
      window.cancelAnimationFrame(animationFrameID.current);
    };
  }, [animationState, showLayer]);

  const userLocationPoint = useMemo(() => showLayer && userLocation?.coords?.longitude
    ? point([
      userLocation.coords.longitude,
      userLocation.coords.latitude,
    ])
    : null
  , [showLayer, userLocation?.coords]);

  const circlePaint = useMemo(() => ({
    'circle-radius': animationState.radius,
    'circle-radius-transition': { duration: 0 },
    'circle-opacity-transition': { duration: 0 },
    'circle-color': 'rgba(0,0,0,0)',
    'circle-stroke-color': '#007cbf',
    'circle-stroke-width': animationState.strokeWidth,
    'circle-stroke-opacity': animationState.opacity,
  }), [animationState.radius, animationState.strokeWidth, animationState.opacity]);

  const layerConfig = { minZoom: 6, condition: !!showLayer };

  useMapSource(CURRENT_USER_LOCATION_SOURCE, userLocationPoint);

  useMapLayer(ICON_LAYER_ID, 'symbol', CURRENT_USER_LOCATION_SOURCE, null, symbolLayout, layerConfig);
  useMapLayer(CIRCLE_LAYER_ID, 'circle', CURRENT_USER_LOCATION_SOURCE, circlePaint, null, layerConfig);

  useMapEventBinding('click', onCurrentLocationIconClick, ICON_LAYER_ID);

  return null;
};

const mapStateToProps = (state) => ({
  currentMapBbox: bboxBoundsPolygon(state),
  userLocation: state.view.userLocation,
  userLocationCanBeShown: userLocationCanBeShown(state),
});
export default connect(mapStateToProps, null)(withMap(memo(UserCurrentLocationLayer)));

UserCurrentLocationLayer.defaultProps = {
  onIconClick() {

  },
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func,
};
