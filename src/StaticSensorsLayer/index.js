import React, { useContext, memo, useCallback, useEffect, useState } from 'react';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';

import { MapContext } from '../App';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { addFeatureCollectionImagesToMap } from '../utils/map';

import GeoJsonLayer from '../GeoJsonLayer';
import LayerBackground from '../common/images/sprites/layer-background-sprite.png';

const LAYER_TYPE = 'symbol';
const LAYER_ID = 'static_sensors_layer';

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
  const getStaticSensorLayer = (event) => map.queryRenderedFeatures(event.point)[0];

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

  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-size': 1.1,
    'icon-anchor': 'bottom',
    'text-anchor': 'center',
    'text-justify': 'center',
    'icon-text-fit-padding': [54, 4, -39.5, 1],
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

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'text-color': 'rgba(0,0,0,0.1)',
    'text-halo-width': 0,
    'text-translate': [0, -30],
  };

  const secondLabelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-offset': [
      'case',
      ['==', ['get', 'image'], null],
      ['literal', [0, -3.8]],
      ['literal', [0, -3.1]],
    ],
    'icon-offset': [
      'case',
      ['has', 'default_status_value'],
      ['literal', [0, -53]],
      ['literal', [0, -22]],
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

  const secondLabelPaint = {
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

  useEffect(() => {
    if (map) {
      const sourceId = `source-${LAYER_ID}`;
      const source = map.getSource(sourceId);
      const layer = map.getLayer(`second_${LAYER_ID}`);
      if (source && !layer) {
        map.addLayer({
          id: `second_${LAYER_ID}`,
          source: sourceId,
          type: LAYER_TYPE,
          layout: secondLabelLayout,
          paint: secondLabelPaint,
        });
      }
    }
  }, [labelLayout, labelPaint, map, secondLabelLayout, secondLabelPaint]);

  const onLayerClick = (event) => onStaticSensorClick(({ event, layer: getStaticSensorLayer(event) }));

  return <>
    <GeoJsonLayer type={LAYER_TYPE} id={LAYER_ID} data={sensorsWithDefaultValue} layout={labelLayout} paint={labelPaint} onClick={onLayerClick}/>
  </>;
};

export default memo(StaticSensorsLayer);