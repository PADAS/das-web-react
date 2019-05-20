import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';

import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

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