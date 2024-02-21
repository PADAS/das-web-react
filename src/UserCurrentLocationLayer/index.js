import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import booleanContains from '@turf/boolean-contains';
import { point } from '@turf/helpers';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';
import { bboxBoundsPolygon, userLocationCanBeShown as userLocationCanBeShownSelector } from '../selectors';
import { MAP_ICON_SCALE, SOURCE_IDS } from '../constants';
import { MapContext } from '../App';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

import GpsLocationIcon from '../common/images/icons/gps-location-icon-blue.svg';

const { CURRENT_USER_LOCATION_SOURCE } = SOURCE_IDS;

const ICON_LAYER_ID = 'current-user-location-icon-layer';
const CIRCLE_LAYER_ID = 'current-user-location-circle-layer';

const FRAMES_PER_SECOND = 20;
const INITIAL_OPACITY = 1;
const INITIAL_RADIUS = 12;
const INITIAL_STROKE_WIDTH = 2;
const MAX_RADIUS = 18;

const SYMBOL_LAYOUT = {
  'icon-image': 'current-location-icon',
  'icon-allow-overlap': true,
  'icon-anchor': 'center',
  'icon-size': 0.6 / MAP_ICON_SCALE,
};

const updateBlipAnimation = (animationState, setAnimationState) => {
  setTimeout(() => {
    const opacity = animationState.opacity - .05;
    if (opacity <= 0) {
      setAnimationState({ opacity: INITIAL_OPACITY, radius: INITIAL_RADIUS, strokeWidth: INITIAL_STROKE_WIDTH });
    } else {
      const radius = animationState.radius + ((MAX_RADIUS - animationState.radius) / FRAMES_PER_SECOND);
      const strokeWidth = animationState.strokeWidth - .05;

      setAnimationState({ opacity, radius, strokeWidth });
    }
  }, 1000 / FRAMES_PER_SECOND);
};

const UserCurrentLocationLayer = ({ onIconClick }) => {
  const map = useContext(MapContext);

  const currentMapBbox = useSelector(bboxBoundsPolygon);
  const userLocation = useSelector((state) => state.view.userLocation);
  const userLocationCanBeShown = useSelector(userLocationCanBeShownSelector);

  const [animationState, setAnimationState] = useState({
    opacity: INITIAL_OPACITY,
    radius: INITIAL_RADIUS,
    strokeWidth: INITIAL_STROKE_WIDTH,
  });

  const userLocationIsInMapBounds = useMemo(
    () => !!currentMapBbox
      && !!userLocation?.coords
      && booleanContains(currentMapBbox, point([userLocation.coords.longitude, userLocation.coords.latitude])),
    [currentMapBbox, userLocation]
  );

  const showLayer = userLocationCanBeShown && userLocationIsInMapBounds;

  const userLocationPoint = showLayer && userLocation?.coords?.longitude
    ? point([userLocation.coords.longitude, userLocation.coords.latitude])
    : null;

  const circlePaint = {
    'circle-radius': animationState.radius,
    'circle-radius-transition': { duration: 0 },
    'circle-opacity-transition': { duration: 0 },
    'circle-color': 'rgba(0,0,0,0)',
    'circle-stroke-color': '#007cbf',
    'circle-stroke-width': animationState.strokeWidth,
    'circle-stroke-opacity': animationState.opacity,
  };

  const layerConfig = { minZoom: 6, condition: !!showLayer };

  const onCurrentLocationIconClick = useCallback(() => {
    onIconClick(userLocation);
  }, [onIconClick, userLocation]);

  useEffect(() => {
    if (map && !map.hasImage('current-location-icon')) {
      addMapImage({ src: GpsLocationIcon, id: 'current-location-icon' });
    }
  }, [map]);

  useEffect(() => {
    if (showLayer) {
      const animationFrameID = window.requestAnimationFrame(
        () => updateBlipAnimation(animationState, setAnimationState)
      );

      return () => window.cancelAnimationFrame(animationFrameID);
    }
  }, [animationState, showLayer]);

  useMapSource(CURRENT_USER_LOCATION_SOURCE, userLocationPoint);

  useMapLayer(ICON_LAYER_ID, 'symbol', CURRENT_USER_LOCATION_SOURCE, null, SYMBOL_LAYOUT, layerConfig);
  useMapLayer(CIRCLE_LAYER_ID, 'circle', CURRENT_USER_LOCATION_SOURCE, circlePaint, null, layerConfig);

  useMapEventBinding('click', onCurrentLocationIconClick, ICON_LAYER_ID);

  return null;
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func.isRequired,
};

export default memo(UserCurrentLocationLayer);
