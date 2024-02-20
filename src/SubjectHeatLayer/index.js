import React, { memo, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import { useSelector } from 'react-redux';

import { trimmedHeatmapTrackData } from '../selectors/tracks';

import HeatLayer from '../HeatLayer';

const SubjectHeatLayer = () => {
  const trackData = useSelector(trimmedHeatmapTrackData);

  const [points, setPoints] = useState(featureCollection([]));

  useEffect(() => {
    const pointFeatures = trackData.reduce((accumulator, { points }) => [...accumulator, ...points.features], []);
    setPoints(featureCollection(pointFeatures));
  }, [trackData]);

  return points.features.length > 0 ? <HeatLayer points={points} /> : null;
};

export default memo(SubjectHeatLayer);
