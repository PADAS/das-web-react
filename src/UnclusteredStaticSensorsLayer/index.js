import { memo, useContext, useEffect } from 'react';

import { LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { MapContext } from '../App';

const { CLUSTERED_DATA_SOURCE_ID, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const UnclusteredStaticSensorsLayerLayer = () => {
  const map = useContext(MapContext);

  const clusteredSource = map.getSource(CLUSTERED_DATA_SOURCE_ID);

  useEffect(() => {
    if (!!clusteredSource && !map.getLayer(UNCLUSTERED_STATIC_SENSORS_LAYER)) {
      map.addLayer({
        id: UNCLUSTERED_STATIC_SENSORS_LAYER,
        source: CLUSTERED_DATA_SOURCE_ID,
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
  }, [clusteredSource, map]);

  return null;
};

export default memo(UnclusteredStaticSensorsLayerLayer);
