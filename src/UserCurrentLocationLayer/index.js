import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { booleanContains, point } from '@turf/turf';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';
import { bboxBoundsPolygon, userLocationCanBeShown as userLocationCanBeShownSelector } from '../selectors';
import { MAP_ICON_SCALE, SOURCE_IDS } from '../constants';
import { MapContext } from '../App';
import { useMapEventBinding } from '../hooks';
import useMapSources from '../hooks/useMapSources';

import GpsLocationIcon from '../common/images/icons/gps-location-icon-blue.svg';
import useMapLayers from '../hooks/useMapLayers';
import throttle from 'lodash/throttle';

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

const UserCurrentLocationLayer = ({ onIconClick }) => {
  const map = useContext(MapContext);

  const currentMapBbox = useSelector(bboxBoundsPolygon);
  const userLocation = useSelector((state) => state.view.userLocation);
  const userLocationCanBeShown = useSelector(userLocationCanBeShownSelector);

  // Use a ref for animation state to avoid unnecessary React re-renders
  const animationStateRef = useRef({
    opacity: INITIAL_OPACITY,
    radius: INITIAL_RADIUS,
    strokeWidth: INITIAL_STROKE_WIDTH,
  });

  const [, forceUpdate] = useState(0); // Used to trigger a re-render only when needed

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

  // Use the ref for animation state
  const circlePaint = {
    'circle-radius': animationStateRef.current.radius,
    'circle-radius-transition': { duration: 0 },
    'circle-opacity-transition': { duration: 0 },
    'circle-color': 'rgba(0,0,0,0)',
    'circle-stroke-color': '#007cbf',
    'circle-stroke-width': animationStateRef.current.strokeWidth,
    'circle-stroke-opacity': animationStateRef.current.opacity,
  };

  const layerConfig = useMemo(() => (
    { minZoom: 6, condition: !!showLayer }
  ), [showLayer]);

  const onCurrentLocationIconClick = useCallback(() => {
    onIconClick(userLocation);
  }, [onIconClick, userLocation]);

  useEffect(() => {
    if (map && !map.hasImage('current-location-icon')) {
      addMapImage({ src: GpsLocationIcon, id: 'current-location-icon' });
    }
  }, [map]);

  useEffect(() => {
    if (!showLayer) return;

    let animationFrameId;

    // Throttle the animation update to FRAMES_PER_SECOND
    const throttledAnimate = throttle(() => {
      let { opacity, radius, strokeWidth } = animationStateRef.current;
      if (opacity > 0) {
        opacity = Math.max(0, opacity - 0.05);
        radius = radius + ((MAX_RADIUS - radius) / FRAMES_PER_SECOND);
        strokeWidth = Math.max(0, strokeWidth - 0.05);
      }
      if (opacity <= 0) {
        opacity = INITIAL_OPACITY;
        radius = INITIAL_RADIUS;
        strokeWidth = INITIAL_STROKE_WIDTH;
      }
      animationStateRef.current = { opacity, radius, strokeWidth };
      forceUpdate(n => n + 1); // Only to update the paint prop
    }, 1000 / FRAMES_PER_SECOND, { leading: true, trailing: true });

    const animate = () => {
      throttledAnimate();
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      throttledAnimate.cancel();
    };
  }, [showLayer]);

  useMapSources([{ id: CURRENT_USER_LOCATION_SOURCE, data: userLocationPoint }]);

  useMapLayers([{
    id: ICON_LAYER_ID,
    type: 'symbol',
    sourceId: CURRENT_USER_LOCATION_SOURCE,
    layout: SYMBOL_LAYOUT,
    options: layerConfig
  }]);

  useMapLayers([{
    id: CIRCLE_LAYER_ID,
    type: 'circle',
    sourceId: CURRENT_USER_LOCATION_SOURCE,
    paint: circlePaint,
    options: layerConfig
  }]);

  useMapEventBinding('click', onCurrentLocationIconClick, ICON_LAYER_ID);

  return null;
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func.isRequired,
};

export default memo(UserCurrentLocationLayer);
