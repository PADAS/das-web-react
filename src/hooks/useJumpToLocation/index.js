import { useContext, useMemo } from 'react';
import { LngLatBounds } from 'mapbox-gl';
import { useLocation as useRouterLocation } from 'react-router-dom';

import { BREAKPOINTS } from '../../constants';
import { getCurrentTabFromURL, getCurrentIdFromURL } from '../../utils/navigation';
import { MapContext } from '../../App';
import { useMatchMedia } from '../';

const SIDEBAR_WIDTH_PIXELS = 512;
const SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS = 736;

const DEFAULT_LOCATION_JUMP_PADDING = {
  left: 12,
  top: 12,
  bottom: 12,
  right: 12,
};

const calcPadding = (currentTab, isArray, itemId, isMediumLayoutOrLarger) => {
  const padding = { ...DEFAULT_LOCATION_JUMP_PADDING };
  const polygonPadding = 350;

  if (isMediumLayoutOrLarger) {
    if (itemId) {
      padding.left = isArray
        ? ( SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS - polygonPadding )
        : SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS;
    } else if (currentTab) {
      padding.left = isArray
        ? ( SIDEBAR_WIDTH_PIXELS - polygonPadding )
        : SIDEBAR_WIDTH_PIXELS + 80;
    }
    padding.right = 90;
  }
  return padding;
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

  const { currentTab, itemId } = useMemo(() => ({
    currentTab: getCurrentTabFromURL(routerLocation.pathname),
    itemId: getCurrentIdFromURL(routerLocation.pathname),
  }), [routerLocation.pathname]);

  return (coords, zoom = 15) => {
    const isArrayCoords = Array.isArray(coords[0]);

    const padding = calcPadding(currentTab, isArrayCoords, itemId, isMediumLayoutOrLarger);

    if (isArrayCoords && coords.length > 1) {
      const mapBoundaries = coords.reduce(buildLocationJumpBounds, new LngLatBounds());
      map.fitBounds(mapBoundaries, { linear: true, speed: 200, padding });
    } else {
      map.easeTo({ center: isArrayCoords ? coords[0] : coords, zoom, padding, speed: 200 });
    }
  };
};

export default useJumpToLocation;
