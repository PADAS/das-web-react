import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { setAnalyzerFeatureActiveStateForIDs, getAnalyzerAdminPoint, fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

// eslint-disable-next-line react/display-name
const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures } = props;

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    return null;
  };

  const onAnalyzerJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsForAnalyzer(map, properties.feature_bounds);
    setTimeout(() => {
      setAnalyzerFeatureActiveStateForIDs(map, properties.feature_group, true);
    }, 200);
    const geometry = getAnalyzerAdminPoint(properties.feature_bounds);
    props.showPopup('analyzer-config', { geometry, properties });
    trackEvent('Map Layers', 'Click Jump To Analyzer Location button',
      `Feature Type:${properties.type_name}`);
  };

  const onJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);
    trackEvent('Map Layers', 'Click Jump To Feature Location button',
      `Feature Type:${properties.type_name}`);
  };

  const onItemJumpButtonClick = () => properties.analyzer_type ? onAnalyzerJumpButtonClick() : onJumpButtonClick();

  return <span className={listStyles.featureTitle}>
    {iconForCategory(properties.analyzer_type)} {properties.title}<LocationJumpButton onButtonClick={onItemJumpButtonClick} />
  </span>;

});

export default connect(null, { showFeatures, showPopup })(FeatureListItem);