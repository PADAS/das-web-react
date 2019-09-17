import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures } = props;

  const iconForCategory = category => { 
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{height: '2rem', width: '2rem'}} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{height: '2rem', width: '2rem'}} />;
    return null;
  }

  const onAnalyzerJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);
    trackEvent('Map Layers', 'Click Jump To Feature Location button', 
      `Feature Type:${properties.type_name}`);
  }

  const onJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);
    trackEvent('Map Layers', 'Click Jump To Feature Location button', 
      `Feature Type:${properties.type_name}`);
  }

  // XXX better way to do this?
  if( properties.analyzer_type) {
    return <h6 className={listStyles.featureTitle}>
            {iconForCategory(properties.analyzer_type)} {properties.title}<LocationJumpButton onButtonClick={onAnalyzerJumpButtonClick} />
          </h6>; 
  } else {
    return <h6 className={listStyles.featureTitle}>
            {properties.title} <LocationJumpButton onButtonClick={onJumpButtonClick} />
          </h6>; 
  }
});

export default connect(null, { showFeatures })(FeatureListItem);