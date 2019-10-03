import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import HeatmapLegend from '../HeatmapLegend';


const ReportsHeatmapLegend = ({ reports, onClose }) => {
  const reportCount = reports.features.length;

  const titleElement = <h6>{`Heatmap: Visible Reports (${reportCount})`}</h6>;

  return <HeatmapLegend
    title={titleElement}
    pointCount={reportCount}
    onClose={onClose} />;
};

const mapStateToProps = (state) => ({
  reports: getMapEventFeatureCollectionWithVirtualDate(state),
});

export default connect(mapStateToProps, null)(memo(ReportsHeatmapLegend));

ReportsHeatmapLegend.propTypes = {
  onClose: PropTypes.func.isRequired,
};