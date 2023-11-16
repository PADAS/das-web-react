import mapboxgl from 'mapbox-gl';
import React, { Fragment, forwardRef, memo, useCallback, useRef, useState, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { MapContext } from '../App';
import MapTerrain from '../MapTerrain';
import SkyLayer from '../SkyLayer';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import mapLabel from '../common/images/icons/symbol-label-outline.png';

import { REACT_APP_MAPBOX_TOKEN, REACT_APP_BASE_MAP_STYLES, MIN_ZOOM, MAX_ZOOM, MAPBOX_STYLE_LAYER_SOURCE_TYPES } from '../constants';

import 'mapbox-gl/dist/mapbox-gl.css';
import '../Map/Map.scss';
import BaseLayerRenderer from '../BaseLayerRenderer';
import Attribution from './Attribution';

mapboxgl.accessToken = REACT_APP_MAPBOX_TOKEN;

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

export function withMap(Component) {
  return forwardRef((props, ref) => <MapContext.Consumer>{map => <Component map={map} {...props} ref={ref} />}</MapContext.Consumer>); // eslint-disable-line react/display-name
};

const getStartingMapPositionValues = (savedMapPosition = {}) => {
  if (savedMapPosition?.center && savedMapPosition?.zoom) {
    const { bearing, center, pitch, zoom } = savedMapPosition;

    return {
      bearing,
      center,
      pitch,
      zoom,
    };
  }

  return {};
};

const EarthRangerMap = (props) => {
  const { currentBaseLayer, children, controls, onMapLoaded, dispatch: _dispatch, ...rest } = props;
  const mapPosition = useSelector(state => state.data.mapPosition);

  const [mapLoaded, setMapLoaded] = useState(false);
  const baseStyleRef = useRef(REACT_APP_BASE_MAP_STYLES);

  const onLoad = useCallback(({ target: map }) => {
    map.loadImage(mapLabel, (_err, img) => {
      map.addImage('name-label-78-sdf', img, {
        sdf: true,
      });

      const scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
      });

      map.addControl(new mapboxgl.NavigationControl({ showZoom: false }), 'top-right');
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(scale, 'bottom-right');

    });

    onMapLoaded && onMapLoaded(map);
    setMapLoaded(true);
  }, [onMapLoaded]);

  const map = useRef(null);
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!map.current) {
      const initialMapPositionOptions = getStartingMapPositionValues(mapPosition);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: REACT_APP_BASE_MAP_STYLES,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        logoPosition: 'bottom-left',
        ...initialMapPositionOptions,
      });
      map.current.on('load', onLoad);
    }
  }, [mapPosition, onLoad]);

  useEffect(() => {
    if (map.current && currentBaseLayer && MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(currentBaseLayer.attributes.type)) {
      const value = currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url;

      if (value !== baseStyleRef.current) {
        map.current.setStyle(currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url);
        baseStyleRef.current = value;
      }
    }
  }, [currentBaseLayer]);

  return <MapContext.Provider value={map.current}>
    <div className="map-wrapper" style={{ height: '100%' }}>
      <div ref={mapContainer} {...rest} >
      </div>
      {mapLoaded && <Fragment>
        <MapTerrain map={map.current} />
        <SkyLayer map={map.current} />
        <div className='map-controls-container'>
          {controls}
        </div>
        {children}
        <Attribution currentBaseLayer={currentBaseLayer}  className='mapboxgl-ctrl mapboxgl-ctrl-attrib er-map' />
        <BaseLayerRenderer />
      </Fragment>}
    </div>
  </MapContext.Provider>;
};


const mapStateToProps = ({ view: { currentBaseLayer } }) => ({
  currentBaseLayer,
});

export default connect(mapStateToProps, null)(memo(EarthRangerMap));
