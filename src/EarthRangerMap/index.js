import mapboxgl from 'mapbox-gl';
import React, { Fragment, forwardRef, memo, useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactMapboxGl, { ZoomControl, MapContext } from 'react-mapbox-gl';
import { uuid } from '../utils/string';

import MapTerrain from '../MapTerrain';
import SkyLayer from '../SkyLayer';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import mapLabel from '../common/images/icons/symbol-label-outline.png';

import { REACT_APP_MAPBOX_TOKEN, REACT_APP_BASE_MAP_STYLES, MIN_ZOOM, MAX_ZOOM, MAPBOX_STYLE_LAYER_SOURCE_TYPES } from '../constants';

import 'mapbox-gl/dist/mapbox-gl.css';
import '../Map/Map.scss';
import BaseLayerRenderer from '../BaseLayerRenderer';
import Attribution from './Attribution';

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  logoPosition: 'bottom-left',
});
const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

export function withMap(Component) {
  return forwardRef((props, ref) => <MapContext.Consumer>{map => <Component map={map} {...props} ref={ref} />}</MapContext.Consumer>); // eslint-disable-line react/display-name
};

const EarthRangerMap = (props) => {
  const { currentBaseLayer, children, controls, onMapLoaded, ...rest } = props;

  const [mapStyle, setMapStyle] = useState(REACT_APP_BASE_MAP_STYLES);

  const onLoad = (map) => {
    map.loadImage(mapLabel, (_err, img) => {
      map.addImage('name-label-78-sdf', img, {
        sdf: true,
      });

      const scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'imperial'
      });

      map.addControl(scale, 'bottom-right');

    });

    onMapLoaded && onMapLoaded(map);
  };

  const id = useRef(uuid());

  const onZoomControlClick = (map, zoomDiff) => {
    zoomDiff > 0 ?
      map.zoomIn({ level: map.getZoom() + zoomDiff }) :
      map.zoomOut({ level: map.getZoom() - zoomDiff });
    mapInteractionTracker.track(`Click 'Zoom ${zoomDiff > 0?'In':'Out'}' button`);
  };

  useEffect(() => {
    if (currentBaseLayer && MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(currentBaseLayer.attributes.type)) {
      setMapStyle(currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url);
    }
  }, [currentBaseLayer]);

  return <MapboxMap
    id={`map-${id.current}`}
    style={mapStyle}
    movingMethod='easeTo'
    {...rest}
    onStyleLoad={onLoad}>
    <MapContext.Consumer>
      {(map) => map && <Fragment>
        <MapTerrain map={map} />
        <SkyLayer map={map} />
        <ZoomControl className="mapbox-zoom-ctrl" position='bottom-right' onControlClick={onZoomControlClick}/>
        <div className='map-controls-container'>
          {controls}
        </div>
        {children}
        <Attribution currentBaseLayer={currentBaseLayer}  className='mapboxgl-ctrl mapboxgl-ctrl-attrib er-map' />
        <BaseLayerRenderer />
      </Fragment>}
    </MapContext.Consumer>
  </MapboxMap>;
};

const mapStateToProps = ({ view: { currentBaseLayer } }) => ({
  currentBaseLayer,
});

export default connect(mapStateToProps, null)(memo(EarthRangerMap));
