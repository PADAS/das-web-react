import { memo, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { API_URL } from '../constants';
import { selectSubjectTracksWithPatrolTrackShownFlag } from '../selectors/patrols';

const TRACK_SEGMENTS_SOURCE = 'track-segments-source';
const TRACK_SEGMENTS_LAYER_ID = 'track-segments-layer';

const VECTOR_TILE_URL = `${API_URL}observations/segments/tiles/{z}/{x}/{y}.pbf`;


const TrackSegmentsLayer = () => {
  const map = useContext(MapContext);

  const isSegmentOnTimeEnabled = useSelector((state) => state.view.trackSettings.isSegmentOnTimeEnabled);
  const isSegmentOnSpeedEnabled = useSelector((state) => state.view.trackSettings.isSegmentOnSpeedEnabled);
  const segmentTimeGapLength = useSelector((state) => state.view.trackSettings.segmentTimeGapLength);
  const segmentSpeedLimit = useSelector((state) => state.view.trackSettings.segmentSpeedLimit);

  const subjectTracksWithPatrolTrackShownFlag = useSelector(selectSubjectTracksWithPatrolTrackShownFlag);
  const visibleSubjectIds = subjectTracksWithPatrolTrackShownFlag.map(
    (subjectTrack) => subjectTrack.track.features[0].properties.id
  );

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

  /* update layer filter based on segmentation settings */
  useEffect(() => {
    if (!map || !map.getLayer(TRACK_SEGMENTS_LAYER_ID)) return;

    const filters = ['all'];

    // Filter by visible subject IDs
    if (visibleSubjectIds.length > 0) {
      filters.push(['in', ['get', 'subject_id'], ['literal', visibleSubjectIds]]);
    }

    // Filter by time gap if enabled
    // time_gap_ms is in milliseconds, segmentTimeGapLength is in seconds
    if (isSegmentOnTimeEnabled) {
      const maxTimeGapMs = segmentTimeGapLength * 1000;
      filters.push(['<=', ['get', 'time_gap_ms'], maxTimeGapMs]);
    }

    // Filter by speed if enabled
    if (isSegmentOnSpeedEnabled) {
      filters.push(['<=', ['get', 'speed_kmh'], segmentSpeedLimit]);
    }

    // Apply filter (use null if no filters are active)
    const finalFilter = filters.length > 1 ? filters : null;
    map.setFilter(TRACK_SEGMENTS_LAYER_ID, finalFilter);
  }, [map, visibleSubjectIds, isSegmentOnTimeEnabled, isSegmentOnSpeedEnabled, segmentTimeGapLength, segmentSpeedLimit]);

  return null;
};

export default memo(TrackSegmentsLayer);
