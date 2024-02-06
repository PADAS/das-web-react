import { memo, useCallback, useContext, useEffect, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import { useDispatch, useSelector } from 'react-redux';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getShouldSubjectsBeClustered } from '../selectors/clusters';
import { LAYER_IDS, SOURCE_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import LayerBackground from '../common/images/sprites/layer-background-sprite.png';
import { MapContext } from '../App';
import { showPopup } from '../ducks/popup';
import { useMapEventBinding, useMapLayer } from '../hooks';
import { backgroundLayerStyles, calcDynamicBackgroundLayerLayout, calcDynamicLabelLayerLayoutStyles, labelLayerStyles } from './layerStyles';

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

const StaticSensorsLayer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const isDataInMapSimplified = useSelector((state) => state.view.simplifyMapDataOnZoom?.enabled);
  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const showMapNames = useSelector((state) => state.view.showMapNames);

  const [layerFilter, setLayerFilter] = useState(DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER);

  const currentLayerId = shouldSubjectsBeClustered ? layerIds[0] : layerIds[1];
  const currentBackgroundLayerId = `${currentLayerId}_BACKGROUND`;
  const currentSourceId = shouldSubjectsBeClustered ? CLUSTERS_SOURCE_ID : SUBJECT_SYMBOLS;

  const showMapStaticSubjectsNames = showMapNames[STATIC_SENSOR]?.enabled ?? false;

  const dynamicBackgroundLayerLayoutProps = calcDynamicBackgroundLayerLayout(
    isDataInMapSimplified,
    showMapStaticSubjectsNames
  );
  const dynamicLabelLayerLayoutProps = calcDynamicLabelLayerLayoutStyles(
    isDataInMapSimplified,
    showMapStaticSubjectsNames
  );

  const backgroundLayoutObject = {
    ...backgroundLayerStyles.layout,
    ...dynamicBackgroundLayerLayoutProps,
  };
  const layerConfig = { filter: layerFilter };
  const layoutObject = {
    ...labelLayerStyles.layout,
    ...dynamicLabelLayerLayoutProps,
  };

  const onLayerClick = useCallback((event) => {
    event.preventDefault();

    setTimeout(() => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [currentBackgroundLayerId] })[0];
      let newFilter;
      if (feature) {
        newFilter = [
          ...DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER,
          ['!=', 'id', feature.properties.id]
        ];

        dispatch(showPopup('subject', {
          geometry: feature.geometry,
          properties: feature.properties,
          coordinates: feature.geometry.coordinates,
          popupAttrsOverride: { offset: [0, 0] },
        }));
      } else {
        newFilter = DEFAULT_STATIONARY_SUBJECTS_LAYER_FILTER;
      }

      setLayerFilter(newFilter);
    });
  }, [currentBackgroundLayerId, dispatch, map]);

  const onLayerMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onLayerMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, [map]);

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

  useEffect(() => {
    if (!!map?.getLayer(currentBackgroundLayerId)) {
      const onSourceData = ({ sourceDataType, sourceId }) => {
        if (sourceId === currentSourceId && sourceDataType !== 'metadata') {
          const features = map.queryRenderedFeatures({ layers: [currentBackgroundLayerId, currentLayerId] });

          addFeatureCollectionImagesToMap(featureCollection(features), { sdf: true });
        }
      };

      map.on('sourcedata', onSourceData);

      return () => map.off('sourcedata', onSourceData);
    }
  }, [currentBackgroundLayerId, currentLayerId, map, currentSourceId]);

  useEffect(() => {
    if (map) {
      map.loadImage(
        LayerBackground,
        (error, image) => !error & map.addImage(IMAGE_DATA.id, image, IMAGE_DATA.options)
      );
    }
  }, [map]);

  return null;
};

export default memo(StaticSensorsLayer);
