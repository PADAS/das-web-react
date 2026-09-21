import { useContext } from 'react';
import { useLocation as useRouterLocation } from 'react-router';

import { BREAKPOINTS } from '../../constants';
import { calcSidebarPaddingLeft } from '../../utils/map';
import { MapContext } from '../../MapContext';
import { useMatchMedia } from '../';

const DEFAULT_LOCATION_JUMP_PADDING = {
  left: 12,
  top: 12,
  bottom: 12,
  right: 12,
};
const MAP_CONTROLS_PADDING_PIXELS = 90;
const MIN_UNPADDED_MAP_WIDTH_PIXELS = 150;

const flattenToCoordinatePairs = (coords) => (Array.isArray(coords[0]) ? coords.flatMap(flattenToCoordinatePairs) : [coords]);

const calcLocationJumpPadding = (isMediumLayoutOrLarger, pathname) => {
  const right = isMediumLayoutOrLarger ? MAP_CONTROLS_PADDING_PIXELS : DEFAULT_LOCATION_JUMP_PADDING.right;
  const sidebarPaddingLeft = calcSidebarPaddingLeft({ isMediumLayoutOrLarger, pathname });

  return {
    ...DEFAULT_LOCATION_JUMP_PADDING,
    right,
    // Mapbox fits nothing into a canvas its padding leaves no room in, so the
    // sidebar's share of the map stops where the map's own begins.
    ...(sidebarPaddingLeft !== undefined && {
      left: Math.min(sidebarPaddingLeft, window.innerWidth - right - MIN_UNPADDED_MAP_WIDTH_PIXELS),
    }),
  };
};

const useJumpToLocation = () => {
  const routerLocation = useRouterLocation();
  const map = useContext(MapContext);
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  return (coords, zoom = 15, options = {}) => {
    const isArrayCoords = Array.isArray(coords[0]);

    const padding = calcLocationJumpPadding(isMediumLayoutOrLarger, routerLocation.pathname);

    if (isArrayCoords && coords.length > 1) {
      const points = coords.flatMap(flattenToCoordinatePairs);
      let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
      points.forEach(([lng, lat]) => {
        if (lng < west) west = lng;
        if (lng > east) east = lng;
        if (lat < south) south = lat;
        if (lat > north) north = lat;
      });
      const mapBoundaries = [[west, south], [east, north]];
      map.fitBounds(mapBoundaries, { linear: true, speed: 200, padding, ...options });
    } else {
      map.easeTo({ center: isArrayCoords ? coords[0] : coords, zoom, padding, speed: 200, ...options });
    }
  };
};

export default useJumpToLocation;
