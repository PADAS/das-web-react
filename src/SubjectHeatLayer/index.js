import { memo, useEffect, useState } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { LAYER_IDS, PREVIEW_FEATURES } from '../constants';
import { selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope } from '../selectors/tracks';
import { usePreviewFeature } from '../hooks';

import HeatLayer from '../HeatLayer';

const SubjectHeatLayer = () => {
  const eventVectorTilesEnabled = usePreviewFeature(PREVIEW_FEATURES.EVENTS_VECTOR_TILES);

  const trackData = useSelector(selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope);

  const [points, setPoints] = useState(featureCollection([]));

  useEffect(() => {
    const pointFeatures = trackData.reduce((accumulator, { points }) => [...accumulator, ...points.features], []);
    // Updating state from this effect is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPoints(featureCollection(pointFeatures));
  }, [trackData]);

  // Sit the heatmap just beneath whichever event symbol layer is mounted.
  const beforeLayerId = eventVectorTilesEnabled ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return points.features.length > 0 ? <HeatLayer points={points} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(SubjectHeatLayer);
