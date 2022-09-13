import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { setIsPickingLocation } from '../ducks/map-ui';

import { validateEventPolygonPoints } from '../utils/geometry';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const TIMEOUT_TO_REMOVE_REDUNDANT_POINT = 150;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  // TODO: Set the current event polygon by default
  const [geoJson, setGeoJson] = useState(null);
  const [geometryPoints, setGeometryPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);

  const isGeometryAValidPolygon = geometryPoints.length > 2;

  const onChangeGeometry = useCallback((newPoints, newGeoJson) => {
    const isNewGeometryAValidPolygon = newPoints.length > 2;
    console.log('onChangeGeometry: ', newGeoJson?.fillLabelPoint?.properties?.areaLabel);

    if (isDrawing || isNewGeometryAValidPolygon) {
      setGeometryPoints(newPoints);
      setGeoJson(newGeoJson);
    }
  }, [isDrawing]);

  const onCompleteDrawing = useCallback((newGeoJson) => {
    console.log('onCompleteDrawing: ', newGeoJson?.fillLabelPoint?.properties?.areaLabel);
    setGeoJson(newGeoJson);
  }, []);

  const disableSaveButton = useMemo(() =>
    isDrawing || !validateEventPolygonPoints([...geometryPoints, geometryPoints[0]])
  , [geometryPoints, isDrawing]);

  const onClickPoint = useCallback((event) => {
    if (isGeometryAValidPolygon) {
      const isInitialPointClicked = !!map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => point.properties.pointIndex === 0);
      if (isInitialPointClicked) {
        setTimeout(() => setGeometryPoints(geometryPoints), TIMEOUT_TO_REMOVE_REDUNDANT_POINT);
        setIsDrawing(false);
      }
    }
  }, [geometryPoints, isGeometryAValidPolygon, map]);

  const onSaveGeometry = useCallback(() => {
    setMapDrawingData(geoJson);
    dispatch(setIsPickingLocation(false));
  }, [dispatch, geoJson, setMapDrawingData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Enter':
        return isGeometryAValidPolygon && setIsDrawing(false);
      case 'Escape':
        return dispatch(setIsPickingLocation(false));
      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, geometryPoints, isDrawing, isGeometryAValidPolygon]);

  return <>
    <ReportOverview
      area={geoJson?.fillLabelPoint?.properties?.areaLabel}
      perimeter={geoJson?.drawnLineSegments?.properties?.lengthLabel}
    />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      onCompleteDrawing={onCompleteDrawing}
      points={geometryPoints}
    />
    <Footer disableSaveButton={disableSaveButton} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
