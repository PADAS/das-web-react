import React, { memo, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { center, bboxPolygon } from '@turf/turf';


import { showFeatures } from '../../../ducks/map-layer-filter';
import { setMapFeatureHighlightIDs } from '../../../ducks/map-ui';
import { showPopup } from '../../../ducks/popup';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../../../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../../../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../../../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../../../LocationJumpButton';
import { POLYGONS_LAYER_ID, LINES_LAYER_ID } from '../../../SpatialFeaturesLayer';

import { MapContext } from '../../../App';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

// eslint-disable-next-line react/display-name
const FeatureListItem = memo((props) => {
  const map = useContext(MapContext);

  const dispatch = useDispatch();

  const setFeatureActiveStateByID = (map, id, enter = true) => {
    if (!enter) {
      return dispatch(
        setMapFeatureHighlightIDs([])
      );
    }

    const features = map.queryRenderedFeatures({
      filter: ['in', 'id', id],
      layers: [POLYGONS_LAYER_ID, LINES_LAYER_ID],
    });

    const featureIds = features.map((feature) => feature?.properties?.id).filter(Boolean);

    return dispatch(
      setMapFeatureHighlightIDs(featureIds)
    );
  };

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{ height: '2rem', width: '2rem' }} />;
    return null;
  };

  const onJumpButtonClick = () => {
    dispatch(
      showFeatures(props.id)
    );
    map.fitBounds(props.bounds, { duration: 0, minZoom: 5, maxZoom: 16, padding: 20 });
    setTimeout(() => {
      setFeatureActiveStateByID(map, props.id, true);

      const centerPoint = center(bboxPolygon(props.bounds), { properties: { id: props.id, name: props.name } });
      dispatch(
        showPopup('feature-symbol', { ...centerPoint, coordinates: centerPoint.geometry.coordinates })
      );
    }, 200);


    mapLayerTracker.track('Click Jump To Feature Location button',
      `Feature Type:${props.type_name}`);
  };

  const onMouseOverFeature = (enter) => {
    setFeatureActiveStateByID(map, props.id, (enter));
  };

  return <span className={styles.featureTitle} onMouseEnter={() => onMouseOverFeature(true)} onMouseLeave={() => onMouseOverFeature(false)}>
    {(props.analyzer_type && iconForCategory(props.analyzer_type))} {props.name}<LocationJumpButton bypassLocationValidation={true} onClick={onJumpButtonClick} />
  </span>;

});

export default FeatureListItem;
