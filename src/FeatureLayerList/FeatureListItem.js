import React, { memo } from 'react';
import { connect } from 'react-redux';
import center from '@turf/center';
import { feature } from '@turf/helpers';

import { showFeatures } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

/* const geometryIsPoint = ({ type, coordinates }) => {
  return (type === 'Point' || (type === 'MultiPoint' && coordinates.length === 1));
}; */

// eslint-disable-next-line react/display-name
const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures, showPopup } = props;

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    return null;
  };

  const onJumpButtonClick = () => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);

    const popupFeature = feature(geometry);
    const centerPoint = center(popupFeature);

    centerPoint.properties = { ...properties };

    showPopup('feature-symbol', centerPoint);

    trackEvent('Map Layers', 'Click Jump To Feature Location button',
      `Feature Type:${properties.type_name}`);
  };

  const onMouseOverFeature = (enter) => {
    setFeatureActiveStateByID(map, properties.id, (enter));
  };

  return <span className={listStyles.featureTitle} onMouseEnter={() => onMouseOverFeature(true)} onMouseLeave={() => onMouseOverFeature(false)}>
    {iconForCategory(properties.analyzer_type)} {properties.title}<LocationJumpButton bypassLocationValidation={true} map={map} onClick={onJumpButtonClick} />
  </span>;

});

export default connect(null, { showFeatures, showPopup })(FeatureListItem);
