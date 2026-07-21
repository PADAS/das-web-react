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

const toLeafCoords = (coords) => (Array.isArray(coords[0]) ? coords.flatMap(toLeafCoords) : [coords]);

const useJumpToLocation = () => {
  const routerLocation = useRouterLocation();
  const map = useContext(MapContext);
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  return (coords, zoom = 15, options = {}) => {
    const isArrayCoords = Array.isArray(coords[0]);

    const sidebarPaddingLeft = calcSidebarPaddingLeft({
      isMediumLayoutOrLarger,
      isPolygon: isArrayCoords,
      pathname: routerLocation.pathname,
    });

    const padding = {
      ...DEFAULT_LOCATION_JUMP_PADDING,
      ...(sidebarPaddingLeft !== undefined && { left: sidebarPaddingLeft }),
      ...(isMediumLayoutOrLarger && { right: 90 }),
    };

    if (isArrayCoords && coords.length > 1) {
      const points = coords.flatMap(toLeafCoords);
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
