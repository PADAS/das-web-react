import React, { memo } from 'react';

import SpideredReportMarker from '../SpideredReportMarker';

const SpideredReportMarkers = (props) => {
  const { reports, eventTypes, mapImages } = props;

  return reports.map(report => <SpideredReportMarker key={report.id} eventTypes={eventTypes} mapImages={mapImages} report={report} />);

};

export default memo(SpideredReportMarkers);