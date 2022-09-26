import React, { memo } from 'react';
import { connect } from 'react-redux';

import { getMapEventFeatureCollectionByTypeWithVirtualDate } from '../selectors/events';
import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = ({ reports }) => reports?.features?.length && <HeatLayer points={reports} />;

const mapStateToProps = state => ({
  reports: () => {
    const byType = getMapEventFeatureCollectionByTypeWithVirtualDate(state);

    return ['Point', 'PolygonCentersOfMass']
      .reduce((array, type) =>
        byType[type]
          ? [...array, ...byType[type]]
          : array,
      []);
  },
});

export default connect(mapStateToProps, null)(memo(ReportsHeatLayer));

/* points */