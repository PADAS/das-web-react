import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import mapLabel from '../common/images/icons/symbol-label-outline.png';

import { MapContext } from '../App';
import {
  MAPBOX_STYLE_LAYER_SOURCE_TYPES,
  MAX_ZOOM,
  MIN_ZOOM,
  REACT_APP_BASE_MAP_STYLES,
  REACT_APP_MAPBOX_TOKEN,
} from '../constants';

import Attribution from './Attribution';
import BaseLayerRenderer from '../BaseLayerRenderer';
import MapTerrain from '../MapTerrain';
import SkyLayer from '../SkyLayer';

import 'mapbox-gl/dist/mapbox-gl.css';
import '../Map/Map.scss';

mapboxgl.accessToken = REACT_APP_MAPBOX_TOKEN;

const getStartingMapPositionValues = (mapPosition) => mapPosition?.center && mapPosition.zoom
  ? { bearing: mapPosition.bearing, center: mapPosition.center, pitch: mapPosition.pitch, zoom: mapPosition.zoom }
  : {};

const EarthRangerMap = ({ children, controls, onMapLoaded, ...otherProps }) => {
  const { t } = useTranslation('map-controls', { keyPrefix: 'earthRangerMap' });

  const currentBaseLayer = useSelector(state => state.view.currentBaseLayer);
  const mapPosition = useSelector(state => state.data.mapPosition);

  const baseStyleRef = useRef(REACT_APP_BASE_MAP_STYLES);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  const onLoad = useCallback(({ target: map }) => {
    map.loadImage(mapLabel, (_err, img) => {
      map.addImage('name-label-78-sdf', img, { sdf: true });

      const scale = new mapboxgl.ScaleControl({ maxWidth: 80 });

      map.addControl(new mapboxgl.NavigationControl({ showZoom: false }), 'top-right');
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(scale, 'bottom-right');
    });

    onMapLoaded && onMapLoaded(map);

    setMapLoaded(true);
  }, [onMapLoaded]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        locale: {
          'Map.Title': t('mapTitle'),
          'NavigationControl.ResetBearing': t('navigationResetBearing'),
          'NavigationControl.ZoomIn': t('navigationZoomIn'),
          'NavigationControl.ZoomOut': t('navigationZoomOut'),
        },
        logoPosition: 'bottom-left',
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        maxPitch: 65,
        style: REACT_APP_BASE_MAP_STYLES,
        ...getStartingMapPositionValues(mapPosition),
      });

      mapRef.current.on('load', onLoad);
    }
  }, [mapPosition, onLoad, t]);

  useEffect(() => {
    if (mapRef.current
      && currentBaseLayer
      && MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(currentBaseLayer.attributes.type)) {
      const value = currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url;

      if (value !== baseStyleRef.current) {
        mapRef.current.setStyle(currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url);
        baseStyleRef.current = value;
      }
    }
  }, [currentBaseLayer]);

  return <MapContext.Provider value={mapRef.current}>
    <div className="map-wrapper" style={{ height: '100%' }}>
      <div ref={mapContainerRef} {...otherProps} />

      {mapLoaded && <>
        <MapTerrain map={mapRef.current} />

        <SkyLayer map={mapRef.current} />

        <div className='map-controls-container'>{controls}</div>

        {children}

        <Attribution currentBaseLayer={currentBaseLayer} className='mapboxgl-ctrl mapboxgl-ctrl-attrib er-map' />

        <BaseLayerRenderer />
      </>}
    </div >
  </MapContext.Provider >;
};

export default memo(EarthRangerMap);
