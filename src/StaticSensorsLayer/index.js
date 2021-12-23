import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import { MapContext } from '../App';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';

import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

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

const StaticSensorsLayer = ({ staticSensors, onStaticSensorClick }) => {
  const map = useContext(MapContext);
  const [sensorsWithDefaultValue, setSensorsWithDefaultValue] = useState({});
  const getStaticSensorLayer = useCallback((event) => map.queryRenderedFeatures(event.point)[0], [map]);

  const addDefaultStatusValue = useCallback((features = []) => {
    return features.map(feature => {
      const featureProperties = feature?.properties ?? {};
      const featureDeviceProperties = featureProperties?.device_status_properties ?? [];
      const defaultProperty = featureDeviceProperties.find(deviceProperty => deviceProperty?.default ?? false);

      if (isEmpty(defaultProperty)) return feature;

      let featureWithDefaultValue = set(feature, 'properties.default_status_value', `${defaultProperty.value} ${defaultProperty.units}`);
      const featureHasImage = !!featureProperties?.image?.length ?? false;
      if (!featureHasImage) {
        featureWithDefaultValue =  set(feature, 'properties.default_status_label', defaultProperty.label);
      }
      return featureWithDefaultValue;
    });
  }, []);

  useEffect(() => {
    setSensorsWithDefaultValue({ ...staticSensors, ...{ features: addDefaultStatusValue(staticSensors.features) } });
  }, [addDefaultStatusValue, staticSensors]);

  const backgroundLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-size': 1.1,
    'icon-anchor': 'bottom',
    'text-anchor': 'center',
    'text-justify': 'center',
    'icon-text-fit-padding': [39, 4, -24.5, 1],
    'icon-text-fit': 'both',
    'text-offset': [
      'case',
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value']],
      ['literal', [0, .2]],
      ['has', 'default_status_value'],
      ['literal', [0, -.4]],
      ['literal', [0, 0]],
    ],
    'text-field': [
      'case',
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value']],
      ['format',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      ['has', 'default_status_value'],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      ['format',
        'icon',
        { 'font-scale': 1.3 },
        '\n',
      ],
    ],
    'icon-image': 'popup-background',
  };

  const backgroundPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': 'rgba(0,0,0,0.1)',
    'text-halo-width': 0,
    'text-translate': [0, -30],
  };

  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-offset': [
      'case',
      ['==', ['get', 'image'], null],
      ['literal', [0, -2.5]],
      ['literal', [0, -1.8]],
    ],
    'icon-offset': [
      'case',
      ['has', 'default_status_value'],
      ['literal', [0, -20]],
      ['literal', [0, 7]],
    ],
    'icon-anchor': 'top',
    'text-anchor': 'center',
    'text-justify': 'center',
    'text-field': [
      'case',
      ['==', ['get', 'image'], null],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
      ],
      ['get', 'default_status_value'],
    ]
  };

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': '#ffffff',
    'icon-color': '#ffffff',
    'text-halo-width': 0,
    'icon-halo-width': 0,
    'icon-translate': [0, -53],
  };

  useEffect(() => {
    if (!!staticSensors?.features?.length) {
      addFeatureCollectionImagesToMap(staticSensors, { sdf: true });
    }
  }, [staticSensors]);

  useEffect(() => {
    if (map) {
      map.loadImage(LayerBackground, (error, image) => {
        if (error) throw error;
        if (!map.hasImage(IMAGE_DATA.id)) {
          map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options);
        }
      });
    }
  }, [map]);

  const onLayerClick = useCallback((event) => {
    const clickedLayer = getStaticSensorLayer(event);
    const clickedLayerID = clickedLayer.layer.id.replace(PREFIX_ID, '');
    map.setLayoutProperty(clickedLayerID, 'visibility', 'none');
    map.setLayoutProperty(`${PREFIX_ID}${clickedLayerID}`, 'visibility', 'none');
    onStaticSensorClick(({ event, layer: clickedLayer }));
  }, [getStaticSensorLayer, map, onStaticSensorClick]);

  const createLayer = useCallback((layerID, sourceId, layout, paint) => {
    if (!map.getLayer(layerID)) {
      map.addLayer({
        id: layerID,
        source: sourceId,
        type: LAYER_TYPE,
        layout: layout,
        paint: paint
      });
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
          createLayer(layerID, sourceId, backgroundLayout, backgroundPaint);
          createLayer(`${PREFIX_ID}${layerID}`, sourceId, labelLayout, labelPaint);
          map.on('click', layerID, onLayerClick);
        }
      });
    }
  }, [backgroundLayout, backgroundPaint, createLayer, labelLayout, labelPaint, map, onLayerClick, sensorsWithDefaultValue]);

  return null;
};

export default memo(StaticSensorsLayer);