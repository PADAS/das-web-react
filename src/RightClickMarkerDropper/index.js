import React, { useContext, useEffect } from 'react';  /* eslint-disable-line no-unused-vars */
import { connect } from 'react-redux';

import { showPopup } from '../ducks/popup';

import { MapContext } from '../App';


const RightClickMarkerDropper = (props) => {
  const { showPopup } = props;
  
  const map = useContext(MapContext);

  useEffect(() => {
    if (map) {
      const onRightClickMap = (e) => {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];

        showPopup('dropped-marker', { location: e.lngLat, coordinates, popupAttrs: {
          offset: [0, 0],
        } });
      };

      map.on('contextmenu', onRightClickMap);
      return () => {
        map.off('contextmenu', onRightClickMap);
      };
    }
  }, [map, showPopup]);

  return null;
};

export default connect(null, { showPopup })(RightClickMarkerDropper);