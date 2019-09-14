import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures } = props;

  const onJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);
    trackEvent('Map Layers', 'Click Jump To Feature Location button', 
      `Feature Type:${properties.type_name}`);
  }

return <span className={listStyles.featureTitle}>
    {properties.title} <LocationJumpButton onButtonClick={onJumpButtonClick} />
    </span>; 
});

export default connect(null, { showFeatures })(FeatureListItem);