import React, { memo, useContext } from 'react';
import { connect } from 'react-redux';
import { center, bboxPolygon } from '@turf/turf';


import { showFeatures } from '../../../ducks/map-layer-filter';
import { showPopup } from '../../../ducks/popup';
import { setFeatureActiveStateByID } from '../../../utils/features';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../../../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../../../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../../../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../../../LocationJumpButton';

import { MapContext } from '../../../App';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

// eslint-disable-next-line react/display-name
const FeatureListItem = memo((props) => {
  console.log({ 'FeatureListItem properties': props });
  const map = useContext(MapContext);

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    return null;
  };

  const onJumpButtonClick = () => {
    showFeatures(props.id);
    map.fitBounds(props.bounds, { duration: 0, minZoom: 4, maxZoom: 16, padding: 80 });
    setTimeout(() => {
      setFeatureActiveStateByID(map, props.int_id, true);
    }, 200);

    // const popupFeature = feature(geometry);
    // const centerPoint = center(popupFeature);

    const centerPoint = center(bboxPolygon(props.bounds));

    const coordinates = Array.isArray(centerPoint.geometry.coordinates[0]) ? centerPoint.geometry.coordinates[0] : centerPoint.geometry.coordinates;

    showPopup('feature-symbol', { ...centerPoint, coordinates });

    mapLayerTracker.track('Click Jump To Feature Location button',
      `Feature Type:${props.type_name}`);
  };

  const onMouseOverFeature = (enter) => {
    setFeatureActiveStateByID(map, props.int_id, (enter));
  };

  return <span className={styles.featureTitle} onMouseEnter={() => onMouseOverFeature(true)} onMouseLeave={() => onMouseOverFeature(false)}>
    {(props.analyzer_type && iconForCategory(props.analyzer_type))} {props.name}<LocationJumpButton bypassLocationValidation={true} onClick={onJumpButtonClick} />
  </span>;

});

export default connect(null, { showFeatures, showPopup })(FeatureListItem);
