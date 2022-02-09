import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Provider, connect } from 'react-redux';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import store from '../store';
import { MapContext } from '../App';
import { LAYER_IDS } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getSubjectDefaultDeviceProperty } from '../utils/subjects';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';
import SubjectPopup from '../SubjectPopup';

const { STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX } = LAYER_IDS;

const LAYER_TYPE = 'symbol';
const SOURCE_PREFIX = `${STATIC_SENSOR}-source`;
const LAYER_ID = STATIC_SENSOR;
const PREFIX_ID = SECOND_STATIC_SENSOR_PREFIX;

const IMAGE_DATA = {
  id: 'popup-background',
  options: {
    content: [15, 9, 130, 125],
    stretchX: [[17, 46], [94, 122]],
    stretchY: [[23, 116]],
    pixelRatio: 2.7
  }
};

const StaticSensorsLayer = ({ staticSensors = [], isTimeSliderActive, showMapNames, simplifyMapDataOnZoom: { enabled: isDataInMapSimplified } }) => {
  const map = useContext(MapContext);

  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
      const { properties } = feature;
      const defaultProperty = getSubjectDefaultDeviceProperty(feature);

      let featureWithDefaultValue;
      featureWithDefaultValue =  set(feature, 'properties.data_map_id_simplified', isDataInMapSimplified);
      featureWithDefaultValue =  set(feature, 'properties.show_map_names', showMapStaticSubjectsNames);

      if (!isEmpty(defaultProperty)) {
        featureWithDefaultValue = set(feature, 'properties.default_status_value', isTimeSliderActive ? 'No historical data' : `${defaultProperty.value} ${defaultProperty.units}`);
      };

      if (!properties?.image?.length) {
        featureWithDefaultValue =  set(feature, 'properties.default_status_label', defaultProperty.label) ;
      }

      return featureWithDefaultValue;
    });
  }, [isDataInMapSimplified, isTimeSliderActive, showMapStaticSubjectsNames]);

  useEffect(() => {
    setSensorsWithDefaultValue({ ...staticSensors, ...{ features: addDefaultStatusValue(staticSensors.features) } });
  }, [addDefaultStatusValue, staticSensors]);

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

  const setLayerVisibility = useCallback((layerID, isVisible = true) => {
    const backgroundLayerID = layerID.replace(PREFIX_ID, '');
    const visibility = isVisible ? 'visible' : 'none';
    if (map.getLayer(backgroundLayerID)) {
      map.setLayoutProperty(backgroundLayerID, 'visibility', visibility);
      map.setLayoutProperty(`${PREFIX_ID}${backgroundLayerID}`, 'visibility', visibility);
    }
  }, [map]);

  const createPopup = useCallback((layer) => {
    const { geometry } = layer;

    const elementContainer = document.createElement('div');
    ReactDOM.render(<Provider store={store}>
      <SubjectPopup data={layer}/>
    </Provider>, elementContainer);

    const popup = new mapboxgl.Popup({ offset: [0, 0], anchor: 'bottom', closeButton: false })
      .setLngLat(geometry.coordinates)
      .setDOMContent(elementContainer)
      .addTo(map);

    popup.on('close', () => {
      setLayerVisibility(layer.layer.id);
    });
  }, [setLayerVisibility, map]);

  const onLayerClick = useCallback((event) => {
    const clickedLayer = getStaticSensorLayer(event);
    const clickedLayerID = clickedLayer.layer.id;
    createPopup(clickedLayer);
    setLayerVisibility(clickedLayerID, false);
  }, [setLayerVisibility, createPopup, getStaticSensorLayer]);

  const createLayer = useCallback((layerID, sourceId, layout, paint) => {
    if (!map.getLayer(layerID)) {
      map.addLayer({
        id: layerID,
        source: sourceId,
        type: LAYER_TYPE,
        layout: layout,
        paint: paint
      });

      map.on('mouseenter', layerID, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', layerID, () => map.getCanvas().style.cursor = '');
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      sensorsWithDefaultValue?.features?.forEach((feature, index) => {
        const sourceId = `${SOURCE_PREFIX}-${feature.properties.id}`;
        const sourceData = { ...sensorsWithDefaultValue, features: [sensorsWithDefaultValue.features[index]] };
        const source = map.getSource(sourceId);

        if (source) {
          source.setData(sourceData);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: sourceData,
          });
        }

        const layerID = `${LAYER_ID}${feature.properties.id}`;

        if (!map.getLayer(layerID)) {
          createLayer(layerID, sourceId, BACKGROUND_LAYER.layout, BACKGROUND_LAYER.paint);
          createLayer(`${PREFIX_ID}${layerID}`, sourceId, LABELS_LAYER.layout, LABELS_LAYER.paint);
          map.on('click', layerID, onLayerClick);
        }
      });
    }
  }, [createLayer, isDataInMapSimplified, map, onLayerClick, sensorsWithDefaultValue]);

  return null;
};

const mapStatetoProps = ({ view: { showMapNames, simplifyMapDataOnZoom } }) => ({ showMapNames, simplifyMapDataOnZoom });

export default connect(mapStatetoProps, null)(memo(StaticSensorsLayer));

StaticSensorsLayer.propTypes = {
  staticSensors: PropTypes.object.isRequired,
  isTimeSliderActive: PropTypes.bool,
};