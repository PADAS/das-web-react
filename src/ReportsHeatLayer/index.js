import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = () => {
  const reports = useSelector(getMapEventSymbolPointsWithVirtualDate);

  return reports?.features?.length && <HeatLayer points={reports} />;
};

export default memo(ReportsHeatLayer);

/* points */