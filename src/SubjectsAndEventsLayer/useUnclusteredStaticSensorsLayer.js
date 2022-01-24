import { useContext, useEffect } from 'react';

import { LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { MapContext } from '../App';

const { SUBJECTS_AND_EVENTS_SOURCE_ID, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

export default (source) => {
  const map = useContext(MapContext);

  useEffect(() => {
    if (!!source && !map.getLayer(UNCLUSTERED_STATIC_SENSORS_LAYER)) {
      map.addLayer({
        id: UNCLUSTERED_STATIC_SENSORS_LAYER,
        source: SUBJECTS_AND_EVENTS_SOURCE_ID,
        type: 'circle',
        paint: { 'circle-radius': 0 },
        filter: [
          'all',
          ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
          ['==', 'is_static', true],
          ['!has', 'point_count'],
        ],
      });
    }
  }, [map, source]);
};
