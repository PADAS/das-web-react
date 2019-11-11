import React, { memo } from 'react';
import { connect } from 'react-redux';

import { showFeatures } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEvent } from '../utils/analytics';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

// eslint-disable-next-line react/display-name
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
  };

  const onMouseOverFeature = (enter) => {
    setFeatureActiveStateByID(map, properties.id, (enter));
  };

  return <span className={listStyles.featureTitle} onMouseEnter={() => onMouseOverFeature(true)} onMouseLeave={() => onMouseOverFeature(false)}>
    {properties.title}<LocationJumpButton isMulti={false} isFeature={true} map={map} onClick={onJumpButtonClick} />
  </span>;

});

export default connect(null, { showFeatures, showPopup })(FeatureListItem);
