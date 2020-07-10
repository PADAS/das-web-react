import React, { Fragment, memo, useCallback, useState } from 'react';
import { Source, Layer } from 'react-mapbox-gl';
import { lineString } from '@turf/helpers';

const RULER_LAYER_ID = 'MAP_RULER_LAYER';

const MapRulerLayer = (props) => {
  const [points, setPoints] = useState([]);
  const [drawing, setDrawingState] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);

  const addPoint = useCallback((point) => {
    setPoints([...points, point]);
  }, [points]);


  const calcDataForGeoJsonLayer = () => {
    if (!drawing) {
      return lineString(points);
    }
    return lineString([...points, cursorPosition]);
    if (points.length === 1) {
      return lineString([points[0], popupCoords]);
    }
  };

  const sourceData = {
    type: 'geojson',
    data: calcDataForGeoJsonLayer(),
  };

  const mapRulerData = {
    type: 'geojson',
    data: points,
  };

  return <Fragment>
    <Source id={RULER_LAYER_ID} geoJsonSource={mapRulerData} />
    <Layer />
  </Fragment>;

};

export default memo(MapRulerLayer);