import { useContext } from 'react';
import { LngLatBounds } from 'mapbox-gl';
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

const extendBoundsForMultiDimensionalCoords = (coords, mapBounds) => {
  coords.forEach(coord => mapBounds.extend(coord));
  return mapBounds;
};

const buildLocationJumpBounds = (bounds, coords) => {
  const isMultiDimensionalCoords = Array.isArray(coords[0]);
  return isMultiDimensionalCoords ? extendBoundsForMultiDimensionalCoords(coords, bounds) : bounds.extend(coords);
};

const useJumpToLocation = () => {
  const routerLocation = useRouterLocation();
  const map = useContext(MapContext);
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  return (coords, zoom = 15) => {
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
      const mapBoundaries = coords.reduce(buildLocationJumpBounds, new LngLatBounds());
      map.fitBounds(mapBoundaries, { linear: true, speed: 200, padding });
    } else {
      map.easeTo({ center: isArrayCoords ? coords[0] : coords, zoom, padding, speed: 200 });
    }
  };
};

export default useJumpToLocation;
