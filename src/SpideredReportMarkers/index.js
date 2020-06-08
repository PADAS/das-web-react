import React, { memo } from 'react';
import { ReactMapboxGlSpiderifier } from 'react-mapbox-gl-spiderifier';
import isEqual from 'lodash/isEqual';

import SpideredReportMarker from '../SpideredReportMarker';

const CIRCLE_FOOT_SEPARATION = 80;
const SPIRAL_FOOT_SEPARATION = 90;
const SPIRAL_LENGTH_FACTOR = 7;

const SpideredReportMarkers = (props) => {
  const { clusterCoordinates, reports, eventTypes, mapImages, onReportClick } = props;
  return <ReactMapboxGlSpiderifier coordinates={clusterCoordinates} circleFootSeparation={CIRCLE_FOOT_SEPARATION} spiralFootSeparation={SPIRAL_FOOT_SEPARATION} spiralLengthFactor={SPIRAL_LENGTH_FACTOR}>
    {reports.map(report => <SpideredReportMarker onClick={onReportClick} key={report.id} eventTypes={eventTypes} mapImages={mapImages} report={report} />)}
  </ReactMapboxGlSpiderifier>;
};

export default memo(SpideredReportMarkers, (prev, current) =>
  isEqual(prev.reports, current.reports) 
  && isEqual(prev.clusterCoordinates, current.clusterCoordinates)
);