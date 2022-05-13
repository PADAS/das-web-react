import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Provider, connect } from 'react-redux';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import store from '../store';
import { MapContext } from '../App';
import { LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getSubjectDefaultDeviceProperty } from '../utils/subjects';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';
import SubjectPopup from '../SubjectPopup';


const { CLUSTERS_SOURCE_ID, STATIC_SENSOR, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;

const UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND = 'UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND';

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

const popup = new mapboxgl.Popup({ offset: [0, 0], anchor: 'bottom', closeButton: false });


const StaticSensorsLayer = ({ staticSensors = { features: [] }, isTimeSliderActive, showMapNames, simplifyMapDataOnZoom: { enabled: isDataInMapSimplified } }) => {
  const map = useContext(MapContext);
  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);
  const [layerFilter, setLayerFilter] = useState(layerFilterDefault);


  const addDefaultStatusValue = useCallback((feature) => {
    const { properties } = feature;
    const defaultProperty = getSubjectDefaultDeviceProperty(feature);

    let featureWithDefaultValue;
    featureWithDefaultValue =  set(feature, 'properties.data_map_id_simplified', isDataInMapSimplified);
    featureWithDefaultValue =  set(feature, 'properties.show_map_names', showMapStaticSubjectsNames);

    if (!isEmpty(defaultProperty)) {
      const propertyUnitsLabel = JSON.parse(JSON.stringify(defaultProperty.units)) ? ` ${defaultProperty.units}` : '';
      featureWithDefaultValue = set(feature, 'properties.default_status_value', isTimeSliderActive ? 'No historical data' : `${defaultProperty.value}${propertyUnitsLabel}`);
    };

    if (!properties?.image?.length) {
      featureWithDefaultValue =  set(feature, 'properties.default_status_label', defaultProperty.label) ;
    }

    return featureWithDefaultValue;
  }, [isDataInMapSimplified, isTimeSliderActive, showMapStaticSubjectsNames]);

  useEffect(() => {
    if (!!staticSensors?.features?.length) {
      addFeatureCollectionImagesToMap(staticSensors, { sdf: true });
    }
  }, [staticSensors]);

  useEffect(() => {
    if (map) {
      map.loadImage(LayerBackground, (error, image) =>
        !error & map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options)
      );
    }
  }, [map]);

  const createPopup = useCallback((feature) => {
    const match = staticSensors.features.find(f => f.properties.id === feature.properties.id);
    const cloned = { ...match };

    const withDefaultValue = addDefaultStatusValue(cloned);

    const { geometry } = withDefaultValue;

    const elementContainer = document.createElement('div');
    ReactDOM.render(<Provider store={store}>
      <SubjectPopup data={withDefaultValue}/>
    </Provider>, elementContainer);

    popup.setLngLat(geometry.coordinates)
      .setDOMContent(elementContainer)
      .addTo(map);

    popup.on('close', () => {
      setLayerFilter(layerFilterDefault);
    });
  }, [addDefaultStatusValue, staticSensors?.features, map]);

  // Renderless layer to query unclustered static sensors

  useEffect(() => {
    if (map && !!map.getSource(CLUSTERS_SOURCE_ID)) {
      if (!map.getLayer(UNCLUSTERED_STATIC_SENSORS_LAYER)) {
        map.addLayer({
          id: UNCLUSTERED_STATIC_SENSORS_LAYER,
          source: CLUSTERS_SOURCE_ID,
          type: 'symbol',
          layout: LABELS_LAYER.layout,
          paint: LABELS_LAYER.paint,
          filter: layerFilter,
        });
        map.addLayer({
          id: UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND,
          source: CLUSTERS_SOURCE_ID,
          type: 'symbol',
          layout: BACKGROUND_LAYER.layout,
          paint: BACKGROUND_LAYER.paint,
          filter: layerFilter,
        }, UNCLUSTERED_STATIC_SENSORS_LAYER);
      }
    }
  }, [map, layerFilter]);

  useEffect(() => {
    if (map) {
      map.setFilter(UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, layerFilter);
      map.setFilter(UNCLUSTERED_STATIC_SENSORS_LAYER, layerFilter);
    }
  }, [layerFilter, map]);

  useEffect(() => {
    const onLayerClick = (event) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND] })[0];

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

    map.on('click', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerClick);

    map.on('mouseenter', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerMouseEnter);

    map.on('mouseleave', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerMouseLeave);

    return () => {
      map.off('click', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerClick);

      map.off('mouseenter', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerMouseEnter);

      map.off('mouseleave', UNCLUSTERED_STATIC_SENSORS_LAYER_BACKGROUND, onLayerMouseLeave);
    };

  }, [createPopup, map, getStaticSensorLayer]);


  return null;
};

const mapStatetoProps = ({ view: { showMapNames, simplifyMapDataOnZoom } }) => ({ showMapNames, simplifyMapDataOnZoom });

export default connect(mapStatetoProps, null)(memo(StaticSensorsLayer));

StaticSensorsLayer.propTypes = {
  staticSensors: PropTypes.object.isRequired,
  isTimeSliderActive: PropTypes.bool,
};