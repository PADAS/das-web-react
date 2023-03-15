import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import center from '@turf/center';
import { feature } from '@turf/helpers';

import { showFeatures } from '../ducks/map-ui';
import { showPopup } from '../ducks/popup';
import { fitMapBoundsToGeoJson, setFeatureActiveStateByID } from '../utils/features';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../LocationJumpButton';

import listStyles from '../SideBar/styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

// eslint-disable-next-line react/display-name
const FeatureListItem = memo((props) => {
  const { properties, map, geometry, showFeatures, showPopup } = props;

  const icon = useMemo(() => {
    if (properties.analyzer_type === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    if (properties.analyzer_type === 'proximity') return <ProximityIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    return null;
  }, [properties?.analyzer_type]);


  const onJumpButtonClick = useCallback(() => {
    showFeatures(properties.id);
    fitMapBoundsToGeoJson(map, { geometry });
    setTimeout(() => {
      setFeatureActiveStateByID(map, properties.id, true);
    }, 200);

    const popupFeature = feature(geometry);
    const centerPoint = center(popupFeature);

    centerPoint.properties = { ...properties };

    const coordinates = Array.isArray(centerPoint.geometry.coordinates[0]) ? centerPoint.geometry.coordinates[0] : centerPoint.geometry.coordinates;

    showPopup('feature-symbol', { ...centerPoint, coordinates });

    mapLayerTracker.track('Click Jump To Feature Location button',
      `Feature Type:${properties.type_name}`);
  }, [geometry, map, properties, showFeatures, showPopup]);

  const onMouseOverFeature = useCallback(enter => {
    setFeatureActiveStateByID(map, properties.id, (enter));
  }, [map, properties.id]);

  const onMouseEnter = useCallback(() => onMouseOverFeature(true), [onMouseOverFeature]);
  const onMouseLeave = useCallback(() => onMouseOverFeature(false), [onMouseOverFeature]);


  return <span className={listStyles.featureTitle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
    {icon} {properties.title}<LocationJumpButton bypassLocationValidation={true} onClick={onJumpButtonClick} />
  </span>;

});

export default connect(null, { showFeatures, showPopup })(FeatureListItem);
