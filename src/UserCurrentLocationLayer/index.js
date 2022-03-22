import React, { memo, useMemo, Fragment, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Source, Layer } from 'react-mapbox-gl';
import { point } from '@turf/helpers';
import booleanContains from '@turf/boolean-contains';

import { userLocationCanBeShown, bboxBoundsPolygon } from '../selectors';

import { addMapImage } from '../utils/map';
import { MAP_ICON_SCALE } from '../constants';
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

  const onCurrentLocationIconClick = () => {
    onIconClick(userLocation);
  };

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

  const sourceData = useMemo(() => {
    if (!showLayer) return null;

    return {
      type: 'geojson',
      data: point([
        userLocation.coords.longitude,
        userLocation.coords.latitude,
      ]),
    };
  }, [showLayer, userLocation]);


  return showLayer && <Fragment>
    <Source id='current-user-location' geoJsonSource={sourceData} />
    <Layer minZoom={6} sourceId='current-user-location' layout={symbolLayout} onClick={onCurrentLocationIconClick} type="symbol" />
    <Layer minZoom={6} sourceId='current-user-location' paint={{
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
export default connect(mapStateToProps, null)(withMap(memo(UserCurrentLocationLayer)));

UserCurrentLocationLayer.defaultProps = {
  onIconClick() {

  },
};

UserCurrentLocationLayer.propTypes = {
  onIconClick: PropTypes.func,
};
