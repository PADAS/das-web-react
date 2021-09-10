import React, { Fragment, forwardRef, memo, useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactMapboxGl, { ZoomControl, ScaleControl, MapContext } from 'react-mapbox-gl';
import { uuid } from '../utils/string';

import { trackEvent } from '../utils/analytics';

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

    });
    if (!map.getSource('mapbox-dem')) {

      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
      // add the DEM source as a terrain layer with exaggerated height
      map.setTerrain({'source': 'mapbox-dem', 'exaggeration': 1.5});

      map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0,
            5,
            0.3,
            8,
            1
          ],
          // set up the sky layer for atmospheric scattering
          'sky-type': 'atmosphere',
          // explicitly set the position of the sun rather than allowing the sun to be attached to the main light source
          // 'sky-atmosphere-sun': getSunPosition(),
          // set the intensity of the sun as a light source (0-100 with higher values corresponding to brighter skies)
          'sky-atmosphere-sun-intensity': 5
        }
      });
    }
    onMapLoaded && onMapLoaded(map);
  };

  const id = useRef(uuid());

  const onZoomControlClick = (map, zoomDiff) => {
    zoomDiff > 0? 
      map.zoomIn({ level: map.getZoom() + zoomDiff }) :
      map.zoomOut({ level: map.getZoom() - zoomDiff });
    trackEvent('Map Interaction', `Click 'Zoom ${zoomDiff > 0?'In':'Out'}' button`);
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
        <ScaleControl className="mapbox-scale-ctrl" position='bottom-right' />
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

const mapStateToProps = ({ view: { currentBaseLayer }}) => ({
  currentBaseLayer,
});

export default connect(mapStateToProps, null)(memo(EarthRangerMap));
