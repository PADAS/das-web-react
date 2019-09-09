import React, { memo } from 'react';
import { connect } from 'react-redux';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';

import { showFeatures } from '../ducks/map-ui';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

const AnalyzerListItem = memo((props) => {
  const { properties, map, geometry, analyzer_type, showFeatures } = props;

  const analyzerIcon = analyzer_type => {
    if (analyzer_type === 'proximity') return ProximityIcon;
    return GeofenceIcon;
  };

  const onJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
      // XXX show analyzer admin dialog on that feature set
    }, 200);
    trackEvent('Map Layers', 'Click Jump To Analyzer Location button', 
      `Feature Type:${analyzer_type}`);
  }

return <h6 className={listStyles.featureTitle}>
    {properties.title} <LocationJumpButton onButtonClick={onJumpButtonClick} />
    </h6>; 
});

export default connect(null, { showFeatures })(AnalyzerListItem);