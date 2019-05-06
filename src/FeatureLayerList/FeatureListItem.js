import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';

import { GENERATED_LAYER_IDS } from '../constants';
import { showFeatures } from '../ducks/map-ui';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';

import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

const { FEATURE_FILLS, FEATURE_LINES } = GENERATED_LAYER_IDS;

const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures } = props;

  const onJumpClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);
  }
  return <h6 className={listStyles.featureTitle}>{properties.title} <LocationJumpButton onButtonClick={onJumpClick} /></h6>; 
});

export default connect(null, { showFeatures })(FeatureListItem);