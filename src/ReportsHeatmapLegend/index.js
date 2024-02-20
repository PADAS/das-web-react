import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { differenceInCalendarDays } from 'date-fns';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';

import HeatmapLegend from '../HeatmapLegend';

const ReportsHeatmapLegend = ({ onClose }) => {
  const { t } = useTranslation('heatmap', { keyPrefix: 'reportsHeatmapLegend' });

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const reports = useSelector(getMapEventSymbolPointsWithVirtualDate);

  const reportCount = reports?.features?.length ?? 0;

  const dayCount = differenceInCalendarDays(
    eventFilter.filter.date_range.upper || new Date(),
    eventFilter.filter.date_range.lower,
  );

  return <HeatmapLegend
    dayCount={dayCount}
    onClose={onClose}
    pointCount={reportCount}
    title={<h6>{t('heatmapLegendTitle')}</h6>}
  />;
};

ReportsHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default memo(ReportsHeatmapLegend);
