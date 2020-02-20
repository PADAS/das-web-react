import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import HeatmapLegend from '../HeatmapLegend';


const ReportsHeatmapLegend = ({ reports, onClose, eventFilter: { filter: { date_range } } }) => {
  const reportCount = reports.features.length;
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
  reports: getMapEventFeatureCollectionWithVirtualDate(state),
  eventFilter: state.data.eventFilter,
});

export default connect(mapStateToProps, null)(memo(ReportsHeatmapLegend));

ReportsHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};