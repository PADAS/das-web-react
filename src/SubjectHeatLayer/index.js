import React, { memo, useEffect, useState } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope } from '../selectors/tracks';

import HeatLayer from '../HeatLayer';

const SubjectHeatLayer = () => {
  const trackData = useSelector(selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope);

  const [points, setPoints] = useState(featureCollection([]));

  useEffect(() => {
    const pointFeatures = trackData.reduce((accumulator, { points }) => [...accumulator, ...points.features], []);
    setPoints(featureCollection(pointFeatures));
  }, [trackData]);

  return points.features.length > 0 ? <HeatLayer points={points} /> : null;
};

export default memo(SubjectHeatLayer);
