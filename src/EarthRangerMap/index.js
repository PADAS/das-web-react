import React, { createContext, Fragment, memo, useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactMapboxGl, { ZoomControl, RotationControl, ScaleControl } from 'react-mapbox-gl';
import { uuid } from '../utils/string';

import { trackEvent } from '../utils/analytics';
import { notifyMissingMapIcons } from '../ducks/map-ui';

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
  const { currentBaseLayer, children, controls, onMapLoaded, ...rest } = props;
  const [map, setMap] = useState(null);


  const [mapStyle, setMapStyle] = useState(REACT_APP_BASE_MAP_STYLES);

  const onLoad = (map) => {
    onMapLoaded && onMapLoaded(map);
    // notify components of missing icons via redux
    map.on('styleimagemissing', function (e) {
      notifyMissingMapIcons(e.id);
    });
    setMap(map);
  };

  const id = useRef(uuid());

  const onZoomControlClick = (map, zoomDiff) => {
    zoomDiff > 0 ?
      map.zoomIn({ level: map.getZoom() + zoomDiff }) :
      map.zoomOut({ level: map.getZoom() - zoomDiff });
    trackEvent('Map Interaction', `Click 'Zoom ${zoomDiff > 0 ? 'In' : 'Out'}' button`);
  };

  useEffect(() => {
    if (currentBaseLayer) {
      if (MAPBOX_STYLE_LAYER_SOURCE_TYPES.includes(currentBaseLayer.attributes.type)) {
        setMapStyle(currentBaseLayer.attributes.styleUrl || currentBaseLayer.attributes.url);
      }
    }
  }, [currentBaseLayer]);

  return <MapboxMap
    id={`map-${id.current}`}
    style={mapStyle}
    movingMethod='easeTo'
    {...rest}
    onStyleLoad={onLoad}>
    <EarthRangerMapContext.Provider value={map}>
      {map && <Fragment>
        <RotationControl position='top-left' />
        <ScaleControl className="mapbox-scale-ctrl" position='bottom-right' />
        <ZoomControl className="mapbox-zoom-ctrl" position='bottom-right' onControlClick={onZoomControlClick} />
        <div className='map-controls-container'>
          {controls}
          <MapBaseLayerControl />
          <MapSettingsControl />
        </div>
        {children}
        <BaseLayerRenderer />
      </Fragment>}
    </EarthRangerMapContext.Provider>
  </MapboxMap>;
};

const mapStateToProps = ({ view: { currentBaseLayer } }) => ({
  currentBaseLayer
});

export default connect(mapStateToProps, { notifyMissingMapIcons })(memo(EarthRangerMap));
