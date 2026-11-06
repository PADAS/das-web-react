import { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../../../ducks/map-layer-filter';
import { showPopup } from '../../../ducks/popup';
import { clearActiveAnalyzerFeatures, setAnalyzerFeatureActiveStateForIDs, getAnalyzerAdminPoint, fitMapBoundsForAnalyzer } from '../../../utils/analyzers';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../../../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../../../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../../../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../../../LocationJumpButton';

import * as styles from '../styles.module.scss';

const ANALYZER_ICON_STYLE = { height: '1.5rem', stroke: 'var(--er-ui-icons)', width: '1.5rem' };

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

// eslint-disable-next-line react/display-name
const AnalyzerListItem = memo((props) => {
  const { features, id, map } = props;
  const { properties } = features[0];

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon style={ANALYZER_ICON_STYLE} />;
    if (category === 'proximity') return <ProximityIcon style={ANALYZER_ICON_STYLE} />;
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
    mapLayerTracker.track('Click Jump To Analyzer Location button',
      `Feature Type:${properties.type_name}`);
  };

  return <span className={styles.analyzerTitle}>
    <div className={styles.analyzersName}>
      {iconForCategory(properties.analyzer_type)}

      {properties.title}
    </div>

    <LocationJumpButton bypassLocationValidation={true} onClick={onJumpButtonClick} />
  </span>;
});

export default connect(null, { showFeatures, showPopup })(AnalyzerListItem);