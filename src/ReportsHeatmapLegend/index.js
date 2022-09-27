import React, { memo } from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import HeatmapLegend from '../HeatmapLegend';


const ReportsHeatmapLegend = ({ onClose, eventFilter: { filter: { date_range } } }) => {
  const reports = useSelector(getMapEventSymbolPointsWithVirtualDate);

  const reportCount = reports?.features?.length ?? 0;
  const { lower, upper } = date_range;

  const dayCount = differenceInCalendarDays(
    upper || new Date(),
    lower,
  );

  const titleElement = <h6>{'Visible Reports'}</h6>;

  return <HeatmapLegend
    title={titleElement}
    pointCount={reportCount}
    dayCount={dayCount}
    onClose={onClose} />;
};

const mapStateToProps = (state) => ({
  eventFilter: state.data.eventFilter,
});

export default connect(mapStateToProps, null)(memo(ReportsHeatmapLegend));

ReportsHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};