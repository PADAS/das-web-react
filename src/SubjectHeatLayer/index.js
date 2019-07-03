import React, { memo } from 'react';
import { connect } from 'react-redux';

import { getHeatmapTrackPoints } from '../selectors';

import HeatLayer from '../HeatLayer';


const SubjectHeatLayer = ({ tracksAsPoints }) => <HeatLayer points={tracksAsPoints} />;

const mapStateToProps = state => ({
  tracksAsPoints: getHeatmapTrackPoints(state),
});

export default connect(mapStateToProps, null)(memo(SubjectHeatLayer));

/* points */