import React, { memo } from 'react';
import { connect } from 'react-redux';

import { getMapEventFeatureCollectionWithVirtualDate } from '../../../selectors/events';
import HeatLayer from '../../../map/layers/HeatLayer';

const ReportsHeatLayer = ({ reports }) => <HeatLayer points={reports} />;

const mapStateToProps = state => ({
  reports: getMapEventFeatureCollectionWithVirtualDate(state),
});

export default connect(mapStateToProps, null)(memo(ReportsHeatLayer));

/* points */