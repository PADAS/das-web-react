import { memo, useContext, useEffect } from 'react';
import { MapContext } from '../App';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { API_URL } from '../constants';

const TRACK_SEGMENTS_SOURCE = 'track-segments-source';
const TRACK_SEGMENTS_LAYER_ID = 'track-segments-layer';

const VECTOR_TILE_URL = `${API_URL}observations/segments/tiles/{z}/{x}/{y}.pbf`;

const TrackSegmentsLayer = () => {
  const map = useContext(MapContext);

  /* add the vector source */
  useEffect(() => {
    if (!map) return;

    if (!map.getSource(TRACK_SEGMENTS_SOURCE)) {
      map.addSource(TRACK_SEGMENTS_SOURCE, {
        type: 'vector',
        tiles: [VECTOR_TILE_URL],
        minzoom: 0,
        maxzoom: 22,
      });
    }

    /* add the line layer */
    if (!map.getLayer(TRACK_SEGMENTS_LAYER_ID)) {
      map.addLayer({
        id: TRACK_SEGMENTS_LAYER_ID,
        type: 'line',
        source: TRACK_SEGMENTS_SOURCE,
        'source-layer': 'observation_segments',
        minzoom: 3,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible'
        },
        paint: {
          'line-color': ['coalesce', ['get', 'stroke'], '#3887be'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 1,
            10, 2,
            15, 3
          ],
          'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 0.8]
        }
      });
    }

    return () => {
      if (map.getLayer(TRACK_SEGMENTS_LAYER_ID)) {
        safeRemoveMapLayer(map, TRACK_SEGMENTS_LAYER_ID);
      }
      if (map.getSource(TRACK_SEGMENTS_SOURCE)) {
        safeRemoveMapSource(map, TRACK_SEGMENTS_SOURCE);
      }
    };
  }, [map]);

  return null;
};

export default memo(TrackSegmentsLayer);
