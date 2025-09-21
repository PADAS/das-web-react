import React, { memo, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { center, bboxPolygon } from '@turf/turf';


import { showFeatures } from '../../../ducks/map-layer-filter';
import { setMapFeatureHighlightIDs } from '../../../ducks/mapFeatureHighlight';
import { showPopup } from '../../../ducks/popup';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../../../utils/analytics';

import { ReactComponent as GeofenceIcon } from '../../../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../../../common/images/icons/proximity-analyzer-icon.svg';
import LocationJumpButton from '../../../LocationJumpButton';
import { SYMBOLS_LAYER_ID, POLYGONS_LAYER_ID, LINES_LAYER_ID } from '../../../SpatialFeaturesLayer';

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
    highlightClickedFeatureSymbol(map, SYMBOLS_LAYER_ID, props.id);
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

let animationFrame = null;
let t = 0;

const animate = (map, layer_id, feature_id) => {
  t += 0.1;
  const pulse = (Math.sin(t) + 1) / 2; // oscillates between 0–1

  const idExpr = ['==', ['get', 'id'], feature_id];

  map.setPaintProperty(layer_id, 'icon-opacity', [
    'case',
    idExpr, pulse, // animate this feature’s opacity
    1              // all others stay solid
  ]);

  animationFrame = requestAnimationFrame(() =>
    animate(map, layer_id, feature_id)
  );
};

const startHighlight = (map, layer_id, feature_id) => {
  if (!animationFrame) {
    animate(map, layer_id, feature_id);
  }
};

const stopHighlight = (map, layer_id) => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  // reset opacity to normal
  map.setPaintProperty(layer_id, 'icon-opacity', 1);
};

const highlightClickedFeatureSymbol = (map, layer_id, feature_id) => {
  startHighlight(map, layer_id, feature_id);
  setTimeout(() => stopHighlight(map, layer_id), 1200); // flash for 1.2s
};
