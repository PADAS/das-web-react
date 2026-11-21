import { useContext, useEffect, useMemo, useRef } from 'react';
import { NavigationType, useLocation, useNavigate as useRouterNavigate, useNavigationType } from 'react-router';

import { formatCameraSearch, LNGLAT_PARAM, parseCameraSearch } from '../../utils/camera-url';

import { MapContext } from '../../MapContext';

export const RECORD_LINK_ZOOM = 16;

// Moves of one Atlas reply arrive this close together, and share one entry.
export const ATLAS_HISTORY_COALESCE_MS = 1500;
// A move that never reports its end is written anyway after this.
export const MOVE_END_TIMEOUT_MS = 3000;

const readCamera = (map) => {
  const { lat, lng } = map.getCenter();

  return { center: [lng, lat], zoom: map.getZoom() };
};

const waitForMoveEnd = (map) => new Promise((resolve) => {
  const onMoveEnd = () => {
    clearTimeout(timeoutId);
    map.off('moveend', onMoveEnd);
    resolve();
  };
  const timeoutId = setTimeout(onMoveEnd, MOVE_END_TIMEOUT_MS);

  map.on('moveend', onMoveEnd);
});

/* Writes the camera around each Atlas move into the browser history, so Back
   returns to where the map was. Before a move the current entry is replaced to
   carry the camera; once the move ends a new entry is pushed with the new one,
   or the entry an Atlas navigation already pushed is replaced. Moves close
   behind an earlier Atlas write replace its entry rather than pushing.

   Writes go straight to the router: they keep the path and the location state,
   so the app's unsaved edits guard (which only ever asks before leaving a
   record) has nothing to stop, and nothing reading the navigation data loses it. */
const useAtlasCameraHistory = () => {
  const location = useLocation();
  const map = useContext(MapContext);
  const routerNavigate = useRouterNavigate();

  const latestRef = useRef({});
  useEffect(() => {
    latestRef.current = { location, map, routerNavigate };
  });

  const lastWriteTimeRef = useRef(-Infinity);

  return useMemo(() => {
    const writeCamera = ({ replace }) => {
      const { location, map, routerNavigate } = latestRef.current;

      routerNavigate(
        { hash: location.hash, pathname: location.pathname, search: formatCameraSearch(location.search, readCamera(map)) },
        { replace, state: location.state }
      );
    };

    // Called before an Atlas action moves the camera, or navigates and then
    // moves it. Returns what the move needs to write its entry.
    const begin = () => {
      const { location, map } = latestRef.current;
      if (!map) return null;

      const isCoalescing = Date.now() - lastWriteTimeRef.current < ATLAS_HISTORY_COALESCE_MS;
      if (!isCoalescing) writeCamera({ replace: true });

      return { isCoalescing, pathname: location.pathname };
    };

    const move = async (session, performMove, { replace = false } = {}) => {
      const { map } = latestRef.current;
      if (!session || !map) {
        performMove();

        return;
      }

      const moveEnd = waitForMoveEnd(map);
      performMove();
      await moveEnd;

      const hasNavigated = latestRef.current.location.pathname !== session.pathname;
      writeCamera({ replace: replace || session.isCoalescing || hasNavigated });
      lastWriteTimeRef.current = Date.now();
    };

    return { begin, move };
  }, []);
};

/* Back and Forward to an entry Atlas wrote put the camera exactly where it
   was. The entry the app opened on is left to the starting jump. Jumping
   writes no history: only Atlas moves do. */
export const useJumpToCameraOnHistoryPop = (map) => {
  const location = useLocation();
  const navigationType = useNavigationType();

  const handledLocationKeyRef = useRef(location.key);

  useEffect(() => {
    if (!map || handledLocationKeyRef.current === location.key) return;

    handledLocationKeyRef.current = location.key;
    if (navigationType !== NavigationType.Pop) return;

    const camera = parseCameraSearch(location.search);
    if (camera?.zoom !== null && camera?.zoom !== undefined) map.jumpTo({ center: camera.center, zoom: camera.zoom });
  }, [location.key, location.search, map, navigationType]);
};

/* The camera of the URL the app opened on. One Atlas wrote (centre and zoom)
   stays in the URL for Back and Forward; a record link's centre alone is read
   once and dropped from it, as before. Returns whether the URL had a camera. */
export const jumpToStartingCamera = ({ location, map, navigate }) => {
  const camera = parseCameraSearch(location.search);

  if (camera && camera.zoom !== null) {
    map.jumpTo({ center: camera.center, zoom: camera.zoom });

    return true;
  }

  const urlParams = new URLSearchParams(location.search);
  if (!urlParams.has(LNGLAT_PARAM)) return false;

  urlParams.delete(LNGLAT_PARAM);
  const remainingSearch = urlParams.toString();

  navigate(
    { ...location, search: remainingSearch ? `?${remainingSearch}` : '' },
    { replace: true, state: { comesFromLngLatRedirection: true } }
  );

  if (camera) map.jumpTo({ center: camera.center, zoom: RECORD_LINK_ZOOM });

  return true;
};

export default useAtlasCameraHistory;
