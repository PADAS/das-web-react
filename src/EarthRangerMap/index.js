import React, { createContext, Fragment, memo, useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactMapboxGl, { ZoomControl, RotationControl, ScaleControl } from 'react-mapbox-gl';
import { uuid } from '../utils/string';
import { jumpToLocation, refreshMapImagesFromStore } from '../utils/map';
import { trackEvent } from '../utils/analytics';

import { REACT_APP_MAPBOX_TOKEN, REACT_APP_BASE_MAP_STYLES, MIN_ZOOM, MAX_ZOOM, MAPBOX_STYLE_LAYER_SOURCE_TYPES } from '../constants';

import MapBaseLayerControl from '../MapBaseLayerControl';
import MapSettingsControl from '../MapSettingsControl';

import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '../Map/Map.scss';
import BaseLayerRenderer from '../BaseLayerRenderer';


const EarthRangerMapContext = createContext(null);

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  logoPosition: 'top-left',
});

export function withMap(Component) {
  return props => <EarthRangerMapContext.Consumer>{map => <Component map={map} {...props} />}</EarthRangerMapContext.Consumer>; // eslint-disable-line react/display-name
};

const EarthRangerMap = (props) => {
  const { currentBaseLayer, children, mapImages, onMapLoaded, ...rest } = props;
  const [map, setMap] = useState(null);

  
  const [mapStyle, setMapStyle] = useState(REACT_APP_BASE_MAP_STYLES);

  const onLoad = (map) => {
    onMapLoaded && onMapLoaded(map);
    setMap(map);
  };

  const id = useRef(uuid());

  const refreshImages = () => {
    refreshMapImagesFromStore(map);
  };

  /**
   * Need to manually zoom in/out here because a onControlClick event handler
   * needed to be introduced to track the GA event, and having such an event
   * handler somehow disables the default onControlClick that performs the
   * zooming. 
   * Using map.zoomIn and .zoomOut for animated zoom instead of jumpy 
   * map.setZoom() function.
   * @param {object} map      The map react-map-gl object.
   * @param {number} zoomDiff The zoom difference value (+ve: zoom in, -ve: zoom out).
   */
  const onZoomControlClick = (map, zoomDiff) => {
    zoomDiff > 0? 
      map.zoomIn({ level: map.getZoom() + zoomDiff }) :
      map.zoomOut({ level: map.getZoom() - zoomDiff });
    trackEvent('Map Interaction', `Click 'Zoom ${zoomDiff > 0?'In':'Out'}' button`);
  };

  useEffect(() => {
    if (currentBaseLayer) {
      if (MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(currentBaseLayer.attributes.type)) {
        setMapStyle(currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url);
      }
    }
    map && setTimeout(refreshImages, 2000);
  }, [currentBaseLayer]);

  return <MapboxMap
    id={`map-${id.current}`}
    style={mapStyle}
    movingMethod='easeTo'
    {...rest}
    onStyleLoad={onLoad}>
    <EarthRangerMapContext.Provider value={map}>
      {map && <Fragment>
        <RotationControl position='top-left'/>
        <ScaleControl className="mapbox-scale-ctrl" position='bottom-right' />
        <ZoomControl className="mapbox-zoom-ctrl" position='bottom-right' onControlClick={onZoomControlClick}/>
        <MapSettingsControl />
        <MapBaseLayerControl />
        {children}
        <BaseLayerRenderer />
      </Fragment>}
    </EarthRangerMapContext.Provider>
  </MapboxMap>;
};

const mapStateToProps = ({ view: { currentBaseLayer }, data: { mapImages } }) => ({
  mapImages,
  currentBaseLayer,
});

export default connect(mapStateToProps, null)(memo(EarthRangerMap));
