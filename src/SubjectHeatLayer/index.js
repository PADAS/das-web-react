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

  // Sit the heatmap just beneath whichever event symbol layer is mounted.
  const beforeLayerId = useEventVectorTiles ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return points.features.length > 0 ? <HeatLayer points={points} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(SubjectHeatLayer);
