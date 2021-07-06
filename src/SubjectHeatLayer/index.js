import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { featureCollection } from '@turf/helpers';

import { trimmedHeatmapTrackData } from '../selectors/tracks';

import HeatLayer from '../HeatLayer';

const convertTrackDataToHeatmapPoints = trackData => featureCollection(trackData.reduce((accumulator, { points }) => [...accumulator, ...points.features], []));


const SubjectHeatLayer = ({ trackData }) => {
  const [points, setPoints] = useState(featureCollection([]));

  useEffect(() => {
    setPoints(convertTrackDataToHeatmapPoints(trackData));
  }, [trackData]);

  if (!points.length) return null;

  return <HeatLayer points={points} />;
};

const mapStateToProps = state => ({
  trackData: trimmedHeatmapTrackData(state),
});

export default connect(mapStateToProps, null)(memo(SubjectHeatLayer));
