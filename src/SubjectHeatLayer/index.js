import React, { memo } from 'react';
import { connect } from 'react-redux';

import { trimmedHeatmapPointFeatureCollection } from '../selectors';

import HeatLayer from '../HeatLayer';


const SubjectHeatLayer = ({ tracksAsPoints }) => <HeatLayer points={tracksAsPoints} />;

const mapStateToProps = state => ({
  tracksAsPoints: trimmedHeatmapPointFeatureCollection(state),
});

export default connect(mapStateToProps, null)(memo(SubjectHeatLayer));

/* points */