import React, { memo, useEffect, useState } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { FEATURE_FLAGS, LAYER_IDS } from '../constants';
import { selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope } from '../selectors/tracks';
import { useFeatureFlag } from '../hooks';

import HeatLayer from '../HeatLayer';

const SubjectHeatLayer = () => {
  const trackData = useSelector(selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope);

  const useEventVectorTiles = useFeatureFlag(FEATURE_FLAGS.EVENTS_VECTOR_TILES);

  const [points, setPoints] = useState(featureCollection([]));

  useEffect(() => {
    const pointFeatures = trackData.reduce((accumulator, { points }) => [...accumulator, ...points.features], []);
    setPoints(featureCollection(pointFeatures));
  }, [trackData]);

  // On the flag-ON path the GeoJSON EVENT_SYMBOLS layer is never mounted, so the heatmap must
  // anchor beneath the vector-tile event symbols instead to keep its z-order (mirrors ReportsHeatLayer).
  const beforeLayerId = useEventVectorTiles ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return points.features.length > 0 ? <HeatLayer points={points} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(SubjectHeatLayer);
