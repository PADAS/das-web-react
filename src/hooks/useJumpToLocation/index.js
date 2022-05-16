import { useContext, useMemo } from 'react';
import { LngLatBounds } from 'mapbox-gl';
import { useLocation } from 'react-router-dom';

import { BREAKPOINTS } from '../../constants';
import { getCurrentTabFromURL, getCurrentIdFromURL } from '../../utils/navigation';
import { MapContext } from '../../App';
import { useMatchMedia } from '../';

const TAB_WIDTH_PIXELS = 512;
const DETAIL_VIEW_WIDTH_PIXELS = 736;

const useJumpToLocation = () => {
  const location = useLocation();

  const map = useContext(MapContext);

  const isMedioumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const padding = useMemo(() => {
    const currentTab = getCurrentTabFromURL(location.pathname);
    const itemId = getCurrentIdFromURL(location.pathname);

    if (isMedioumLayoutOrLarger) {
      if (itemId) {
        return { left: DETAIL_VIEW_WIDTH_PIXELS };
      } else if (currentTab) {
        return { left: TAB_WIDTH_PIXELS };
      }
    }
    return {};
  }, [isMedioumLayoutOrLarger, location.pathname]);

  return (coords, zoom = 15) => {
    const isCoordsArray = Array.isArray(coords[0]);

    if (isCoordsArray && coords.length > 1) {
      const boundaries = coords.reduce((bounds, coords) => bounds.extend(coords), new LngLatBounds());
      map.fitBounds(boundaries, { linear: true, speed: 200, padding });
    } else {
      if (!isCoordsArray) {
        map.setZoom(zoom);
      }
      map.easeTo({ center: isCoordsArray ? coords[0] : coords, padding, zoom, speed: 200 });
    }
  };
};

export default useJumpToLocation;
