import React, { useContext, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';

import { featureCollection } from '@turf/helpers';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { showPopup } from '../ducks/popup';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';

import { useMapLayer, useMapEventBinding } from '../hooks';

import { backgroundLayerStyles, labelLayerStyles, calcDynamicBackgroundLayerLayout, calcDynamicLabelLayerLayoutStyles } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const { STATIC_SENSOR, CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const { SUBJECT_SYMBOLS, CLUSTERS_SOURCE_ID } = SOURCE_IDS;

export const DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER = [
  'all',
  ['==', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE],
  ['==', 'is_static', true],
  ['!has', 'point_count'],
];

const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 9, 130, 125],
    stretchX: [[17, 46], [94, 122]],
    stretchY: [[23, 116]],
    pixelRatio: 2.7
  }
};

const layerIds = [CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER];

const StaticSensorsLayer = ({ showMapNames, simplifyMapDataOnZoom: { enabled: isDataInMapSimplified }, showPopup }) => {
  const map = useContext(MapContext);
  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const [layerFilter, setLayerFilter] = useState(DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER);

  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const currentSourceId = shouldSubjectsBeClustered ? CLUSTERS_SOURCE_ID : SUBJECT_SYMBOLS;

  const currentLayerId = shouldSubjectsBeClustered ? layerIds[0] : layerIds[1];
  const currentBackgroundLayerId = `${currentLayerId}_BACKGROUND`;

  const dynamicBackgroundLayerLayoutProps = useMemo(() =>
    calcDynamicBackgroundLayerLayout(isDataInMapSimplified, showMapStaticSubjectsNames),
  [isDataInMapSimplified, showMapStaticSubjectsNames]);

  const dynamicLabelLayerLayoutProps = useMemo(() =>
    calcDynamicLabelLayerLayoutStyles(isDataInMapSimplified, showMapStaticSubjectsNames),
  [isDataInMapSimplified, showMapStaticSubjectsNames]);

  /* watch the source data for updates, and add potential new icon images to the map if necessary */
  useEffect(() => {
    if (map && !!map.getLayer(currentBackgroundLayerId)) {
      const onSourceData = ({ sourceDataType, sourceId }) => {
        if (sourceId === currentSourceId
          && sourceDataType !== 'metadata') {
          const features = map.queryRenderedFeatures({ layers: [currentBackgroundLayerId, currentLayerId] });
          addFeatureCollectionImagesToMap(featureCollection(features), { sdf: true });
        }
      };
      map.on('sourcedata', onSourceData);

      return () => {
        map.off('sourcedata', onSourceData);
      };
    }
  }, [currentBackgroundLayerId, currentLayerId, map, currentSourceId]);

  /* add the marker's background image on load */
  useEffect(() => {
    if (map) {
      map.loadImage(LayerBackground, (error, image) =>
        !error & map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options)
      );
    }
  }, [map]);

  const createPopup = useCallback((feature) => {
    const { geometry, properties } = feature;

    showPopup('subject', { geometry, properties, coordinates: geometry.coordinates, popupAttrsOverride: {
      offset: [0, 0],
    } });

  }, [showPopup]);

  const onLayerClick = useCallback((event) => {
    setTimeout(() => {

      event.preventDefault();

      const feature = map.queryRenderedFeatures(event.point, { layers: [currentBackgroundLayerId] })[0];
      let newFilter;

      if (feature) {
        newFilter = [
          ...DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER,
          ['!=', 'id', feature.properties.id]
        ];

        createPopup(feature);

      } else {
        newFilter = DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER;
      }
      setLayerFilter(newFilter);

    });
  }, [createPopup, currentBackgroundLayerId, map]);

  const onLayerMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onLayerMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, [map]);


  const layerConfig = useMemo(() => ({
    filter: layerFilter,
  }), [layerFilter]);

  const backgroundLayoutObject = useMemo(() => ({
    ...backgroundLayerStyles.layout,
    ...dynamicBackgroundLayerLayoutProps,
  }), [dynamicBackgroundLayerLayoutProps]);

  const layoutObject = useMemo(() => ({
    ...labelLayerStyles.layout,
    ...dynamicLabelLayerLayoutProps,
  }), [dynamicLabelLayerLayoutProps]);

  useMapLayer(
    currentBackgroundLayerId,
    'symbol',
    currentSourceId,
    backgroundLayerStyles.paint,
    backgroundLayoutObject,
    layerConfig,
  );

  useMapLayer(
    currentLayerId,
    'symbol',
    currentSourceId,
    labelLayerStyles.paint,
    layoutObject,
    layerConfig,
  );

  useMapEventBinding('click', onLayerClick);
  useMapEventBinding('mouseenter', onLayerMouseEnter, currentBackgroundLayerId);
  useMapEventBinding('mouseenter', onLayerMouseLeave, currentBackgroundLayerId);

  return null;
};

const mapStatetoProps = (state) => ({
  showMapNames: state.view.showMapNames,
  simplifyMapDataOnZoom: state.view.simplifyMapDataOnZoom,
});

export default connect(mapStatetoProps, { showPopup })(memo(StaticSensorsLayer));
