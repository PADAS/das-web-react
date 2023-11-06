import { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { showPopup } from '../ducks/popup';

import { MapContext } from '../App';

const RightClickMarkerDropper = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  useEffect(() => {
    if (map) {
      const onContextMenu = (event) => {
        const coordinates = [event.lngLat.lng, event.lngLat.lat];

        dispatch(showPopup('dropped-marker', {
          location: event.lngLat,
          coordinates,
          popupAttrsOverride: { offset: [0, 0] },
        }));
      };

      map.on('contextmenu', onContextMenu);
      return () => map.off('contextmenu', onContextMenu);
    }
  }, [dispatch, map]);

  return null;
};

export default RightClickMarkerDropper;
