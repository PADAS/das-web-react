import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { FEATURE_FLAGS, LAYER_IDS } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { useFeatureFlag } from '../hooks';

import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = () => {
  const useEventVectorTiles = useFeatureFlag(FEATURE_FLAGS.EVENTS_VECTOR_TILES);

  const reports = useSelector(getMapEventSymbolPointsWithVirtualDate);

  const beforeLayerId = useEventVectorTiles ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return reports?.features?.length ? <HeatLayer points={reports} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(ReportsHeatLayer);
