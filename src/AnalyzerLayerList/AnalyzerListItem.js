import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';
import { clearActiveAnalyzerFeatures, setAnalyzerFeatureActiveStateForIDs, getAnalyzerAdminPoint, fitMapBoundsForAnalyzer } from '../utils/analyzers';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

// eslint-disable-next-line react/display-name
const AnalyzerListItem = memo((props) => {
  const { features, id, map } = props;
  const { properties } = features[0];

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '1.5rem', width: '1.5rem' }} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{ height: '1.5rem', width: '1.5rem' }} />;
    return null;
  };

  const onJumpButtonClick = () => {
    setTimeout(() => {
      clearActiveAnalyzerFeatures(map);
      setAnalyzerFeatureActiveStateForIDs(map, properties.feature_group, true);
    }, 200);
    fitMapBoundsForAnalyzer(map, properties.feature_bounds);
    const geometry = getAnalyzerAdminPoint(properties.feature_bounds);
    props.showPopup('analyzer-config', { geometry, properties, analyzerId: id, coordinates: geometry });
    trackEvent('Map Layers', 'Click Jump To Analyzer Location button',
      `Feature Type:${properties.type_name}`);
  };

  return <span className={listStyles.analyzerTitle} >
    {iconForCategory(properties.analyzer_type)} {properties.title}<LocationJumpButton map={map} bypassLocationValidation={true} onClick={onJumpButtonClick} />
  </span>;
});

export default connect(null, { showFeatures, showPopup })(AnalyzerListItem);