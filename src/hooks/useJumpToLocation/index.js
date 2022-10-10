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

const calcPadding = (currentTab, isArray, itemId, isMedioumLayoutOrLarger) => {
  const padding = { ...DEFAULT_LOCATION_JUMP_PADDING };

  if (isMedioumLayoutOrLarger) {
    if (itemId) {
      padding.left = SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS;
    } else if (currentTab) {
      padding.left = isArray ? SIDEBAR_WIDTH_PIXELS : SIDEBAR_WIDTH_PIXELS - 150;
    }
  }
  return padding;
};

const useJumpToLocation = () => {
  const routerLocation = useRouterLocation();
  const map = useContext(MapContext);
  const isMedioumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const { currentTab, itemId } = useMemo(() => ({
    currentTab: getCurrentTabFromURL(routerLocation.pathname),
    itemId: getCurrentIdFromURL(routerLocation.pathname),
  }), [routerLocation.pathname]);

  return (coords, zoom = 15) => {
    const isCoordsArray = Array.isArray(coords[0]);

    const padding = calcPadding(currentTab, isCoordsArray, itemId, isMedioumLayoutOrLarger);

    if (isCoordsArray && coords.length > 1) {
      const boundaries = coords.reduce((bounds, coords) => bounds.extend(coords), new LngLatBounds());
      map.fitBounds(boundaries, { linear: true, speed: 200, padding });
    } else {
      map.easeTo({ center: isCoordsArray ? coords[0] : coords, zoom, padding, speed: 200 });
      map.once('moveend', () => {
        setTimeout(() => {
          const hasFeatures = !!map.queryRenderedFeatures().length;
          if (!hasFeatures) {
            map.flyTo({ zoom: 1, speed: 10 });
            map.flyTo({ zoom, speed: 10 });
          }
        });
      });
    }
  };
};

export default useJumpToLocation;
