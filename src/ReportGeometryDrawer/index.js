import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { setIsPickingLocation } from '../ducks/map-ui';

import { validateEventPolygonPoints } from '../utils/geometry';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const TIMEOUT_TO_REMOVE_REDUNDANT_POINT = 150;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  // TODO: Set the current event polygon by default
  const [geometryPoints, setGeometryPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);

  const isGeometryAValidPolygon = geometryPoints.length > 2;

  const onChangeGeometry = useCallback((newPoints) => {
    const isNewGeometryAValidPolygon = newPoints.length > 2;

    if (isDrawing || isNewGeometryAValidPolygon) {
      setGeometryPoints(newPoints);
    }
  }, [isDrawing]);

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
    dispatch(setIsPickingLocation(false));
  }, [dispatch]);

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
    <ReportOverview />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      points={geometryPoints}
    />
    <Footer disableSaveButton={disableSaveButton} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
