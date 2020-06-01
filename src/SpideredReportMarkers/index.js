import React, { memo } from 'react';
import { ReactMapboxGlSpiderifier } from 'react-mapbox-gl-spiderifier';
import isEqual from 'lodash/isEqual';

import SpideredReportMarker from '../SpideredReportMarker';

const SpideredReportMarkers = (props) => {
  const { clusterCoordinates, reports, eventTypes, mapImages, onReportClick } = props;
  return <ReactMapboxGlSpiderifier coordinates={clusterCoordinates} circleFootSeparation={80} spiralFootSeparation={90}>
    {reports.map(report => <SpideredReportMarker onClick={onReportClick} key={report.id} eventTypes={eventTypes} mapImages={mapImages} report={report} />)}
  </ReactMapboxGlSpiderifier>;
};

export default memo(SpideredReportMarkers, (prev, current) =>
  isEqual(prev.reports, current.reports) 
  && isEqual(prev.clusterCoordinates, current.clusterCoordinates)
);