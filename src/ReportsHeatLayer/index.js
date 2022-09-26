import React, { memo } from 'react';
import { connect } from 'react-redux';

import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = ({ reports }) => reports?.features?.length && <HeatLayer points={reports} />;

const mapStateToProps = state => ({
  reports: getMapEventFeatureCollectionWithVirtualDate(state),
});

export default connect(mapStateToProps, null)(memo(ReportsHeatLayer));

/* points */