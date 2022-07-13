import React, { useContext, memo, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';

import { featureCollection } from '@turf/helpers';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { showPopup } from '../ducks/popup';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';

import { backgroundLayerStyles, labelLayerStyles, calcDynamicBackgroundLayerLayout, calcDynamicLabelLayerLayoutStyles } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';


const { STATIC_SENSOR, CLUSTERED_STATIC_SENSORS_LAYER, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const { SUBJECT_SYMBOLS, CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const layerFilterDefault = [
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

const StaticSensorsLayer = ({ isTimeSliderActive, showMapNames, simplifyMapDataOnZoom: { enabled: isDataInMapSimplified }, showPopup }) => {
  const map = useContext(MapContext);
  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);
  const [layerFilter, setLayerFilter] = useState(layerFilterDefault);

  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const currentSourceId = shouldSubjectsBeClustered ? CLUSTERS_SOURCE_ID : SUBJECT_SYMBOLS;
  const [currentLayerId, currentInactiveLayerId] = shouldSubjectsBeClustered ? [layerIds[0], layerIds[1]] :[layerIds[1], layerIds[0]];
  const currentBackgroundLayerId = `${currentLayerId}_BACKGROUND`;

  const dynamicBackgroundLayerLayoutProps = useMemo(() =>
    calcDynamicBackgroundLayerLayout(isDataInMapSimplified, showMapStaticSubjectsNames),
  [isDataInMapSimplified, showMapStaticSubjectsNames]);

  const dynamicLabelLayerLayoutProps = useMemo(() =>
    calcDynamicLabelLayerLayoutStyles(isDataInMapSimplified, showMapStaticSubjectsNames, isTimeSliderActive),
  [isDataInMapSimplified, showMapStaticSubjectsNames, isTimeSliderActive]);

  useEffect(() => {
    if (map && !!map.getLayer(currentBackgroundLayerId)) {
      const onSourceData = ({ sourceDataType, sourceId }) => {
        if (sourceId === currentSourceId
          && sourceDataType !== 'metadata') {
          const features = map.queryRenderedFeatures({ layers: [currentBackgroundLayerId] })[0];

          addFeatureCollectionImagesToMap(featureCollection(features), { sdf: true });
        }
      };
      map.on('sourcedata', onSourceData);

      return () => {
        map.off('sourcedata', onSourceData);
      };
    }
  }, [currentBackgroundLayerId, map, currentSourceId]);

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

    const handleMapClick = (event) => {
      const stationarySubjectAtPoint = map.queryRenderedFeatures(event.point, { layers: [currentBackgroundLayerId] })[0];

      const newFilter = !!stationarySubjectAtPoint ?  [
        ...layerFilterDefault,
        ['!=', 'id', stationarySubjectAtPoint.properties.id]
      ] : layerFilterDefault;

      setLayerFilter(newFilter);
    };

    setTimeout(() => map.once('click', handleMapClick));

  }, [currentBackgroundLayerId, map, showPopup]);

  // Renderless layer to query unclustered static sensors

  useEffect(() => {
    if (map && !!map.getSource(currentSourceId)) {
      if (!map.getLayer(currentLayerId)) {
        map.addLayer({
          id: currentLayerId,
          source: currentSourceId,
          type: 'symbol',
          layout: labelLayerStyles.layout,
          paint: labelLayerStyles.paint,
          filter: layerFilter,
        });
        map.addLayer({
          id: currentBackgroundLayerId,
          source: currentSourceId,
          type: 'symbol',
          layout: backgroundLayerStyles.layout,
          paint: backgroundLayerStyles.paint,
          filter: layerFilter,
        }, currentLayerId);
      }
      if (map.getLayer(currentInactiveLayerId)) {
        map.removeLayer(currentInactiveLayerId);
      }
    }
  }, [map, currentInactiveLayerId, layerFilter, currentBackgroundLayerId, currentLayerId, currentSourceId]);

  useEffect(() => {
    if (map) {
      map.setFilter(currentBackgroundLayerId, layerFilter);
      map.setFilter(currentLayerId, layerFilter);
    }
  }, [layerFilter, map, currentBackgroundLayerId, currentLayerId]);

  useEffect(() => {
    const onLayerClick = (event) => {
      event.preventDefault();

      const feature = map.queryRenderedFeatures(event.point, { layers: [currentBackgroundLayerId] })[0];

      const newFilter = [
        ...layerFilterDefault,
        ['!=', 'id', feature.properties.id]
      ];

      setLayerFilter(newFilter);

      createPopup(feature);
    };

    const onLayerMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const onLayerMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', currentBackgroundLayerId, onLayerClick);

    map.on('mouseenter', currentBackgroundLayerId, onLayerMouseEnter);

    map.on('mouseleave', currentBackgroundLayerId, onLayerMouseLeave);

    return () => {
      map.off('click', currentBackgroundLayerId, onLayerClick);

      map.off('mouseenter', currentBackgroundLayerId, onLayerMouseEnter);

      map.off('mouseleave', currentBackgroundLayerId, onLayerMouseLeave);
    };

  }, [currentBackgroundLayerId, createPopup, map, getStaticSensorLayer]);

  useEffect(() => {
    if (!!map.getLayer(currentLayerId)) {
      Object.entries(dynamicLabelLayerLayoutProps).forEach(([key, value]) => {
        map.setLayoutProperty(currentLayerId, key, value);
      });
    }
  }, [currentLayerId, dynamicLabelLayerLayoutProps, map]);

  useEffect(() => {
    if (!!map.getLayer(currentBackgroundLayerId)) {
      Object.entries(dynamicBackgroundLayerLayoutProps).forEach(([key, value]) => {
        map.setLayoutProperty(currentBackgroundLayerId, key, value);
      });
    }
  }, [currentBackgroundLayerId, dynamicBackgroundLayerLayoutProps, map]);


  return null;
};

const mapStatetoProps = (state) => ({
  showMapNames: state.view.showMapNames,
  simplifyMapDataOnZoom: state.view.simplifyMapDataOnZoom,
});

export default connect(mapStatetoProps, { showPopup })(memo(StaticSensorsLayer));

StaticSensorsLayer.propTypes = {
  isTimeSliderActive: PropTypes.bool,
};