import React, { createContext, Fragment, memo, useRef, useState } from 'react';
import ReactMapboxGl, { ZoomControl, RotationControl, ScaleControl } from 'react-mapbox-gl';
import { uuid } from '../utils/string';

import { REACT_APP_MAPBOX_TOKEN, MIN_ZOOM, MAX_ZOOM } from '../constants';

import MapSettingsControl from '../MapSettingsControl';

import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './Map.scss';


const EarthRangerMapContext = createContext(null);

const MapboxMap = ReactMapboxGl({
  accessToken: REACT_APP_MAPBOX_TOKEN,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  logoPosition: 'top-left',
});

const mapConfig = {
  style: 'mapbox://styles/vjoelm/ciobuir0n0061bdnj1c54oakh',
  movingMethod: 'easeTo',
};

export const withMapContext = (Component) => props => <EarthRangerMapContext.Consumer>  {/* eslint-disable-line react/display-name */}
  {map => <Component map={map} {...props} />}
</EarthRangerMapContext.Consumer>;

const EarthRangerMap = (props) => {
  const { children, ...rest } = props;
  const [map, setMap] = useState(null);

  const id = useRef(uuid());

  return <MapboxMap
    id={`map-${id.current}`}
    {...mapConfig}
    {...rest}
    onStyleLoad={setMap}>
    <EarthRangerMapContext.Provider value={map}>
      <Fragment>
        {/* {children} */}
        <RotationControl position='top-left' />
        <ScaleControl className="mapbox-scale-ctrl" position='bottom-right' />
        <ZoomControl className="mapbox-zoom-ctrl" position='bottom-right' />
        <MapSettingsControl map={map} />
      </Fragment>
    </EarthRangerMapContext.Provider>
  </MapboxMap>;
};

export default memo(EarthRangerMap);

// secret code burial ground
// for future reference and potential experiments
//  {/* <Source
//           id='terrain_source'
//           tileJsonSource={{
//             type: 'vector',
//             url: 'mapbox://mapbox.mapbox-terrain-v2'
//           }}
//         /> */}
// {/* <Layer
//           type='fill-extrusion'
//           sourceLayer='contour'
//           id='terrain_layer'
//           sourceId='terrain_source'
//           paint={{
//             'fill-extrusion-color': [
//               'interpolate',
//               ['linear'],
//               ['get', 'ele'],
//               1000,
//               '#FFF',
//               1500,
//               '#CCC',
//               2000,
//               '#AAA',
//             ],
//             'fill-extrusion-opacity': 1,
//             'fill-extrusion-height': ["/", ['get', 'ele'], 1],
//           }}
//         /> */}
