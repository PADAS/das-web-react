import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import { useDispatch, useSelector } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { REPORT_GEOMETRY_UNDOABLE_NAMESPACE, setGeometryPoints } from '../ducks/report-geometry';
import { setIsPickingLocation } from '../ducks/map-ui';
import { reset, undo } from '../reducers/undoable';
import { useMapEventBinding } from '../hooks';
import { validateEventPolygonPoints } from '../utils/geometry';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const TIMEOUT_TO_REMOVE_REDUNDANT_POINT = 150;
const VERTICAL_POLYGON_PADDING = 100;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);
  const geometryPoints = useSelector((state) => state.view.reportGeometry.current.points);
  const canUndo = useSelector((state) => !!state.view.reportGeometry.past.length);

  const map = useContext(MapContext);
  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const [isDrawing, setIsDrawing] = useState(true);

  const isGeometryAValidPolygon = geometryPoints.length > 2 && validateEventPolygonPoints([...geometryPoints, geometryPoints[0]]);

  const onClickDiscard = useCallback(() => {
    dispatch(setGeometryPoints([]));
    setIsDrawing(true);
  }, [dispatch]);

  const onUndo = useCallback(() => {
    if (canUndo) {
      dispatch(undo(REPORT_GEOMETRY_UNDOABLE_NAMESPACE));

      const undoingDiscard = geometryPoints.length === 0;
      if (undoingDiscard) {
        setIsDrawing(false);
      }
    }
  }, [canUndo, dispatch, geometryPoints.length]);

  const onChangeGeometry = useCallback((newPoints) => {
    const isNewGeometryAPolygon = newPoints.length > 2;

    if (isDrawing || isNewGeometryAPolygon) {
      dispatch(setGeometryPoints(newPoints));
    }
  }, [dispatch, isDrawing]);

  const disableSaveButton = useMemo(() =>
    isDrawing || !isGeometryAValidPolygon
  , [isGeometryAValidPolygon, isDrawing]);

  const onClickPoint = useCallback((event) => {
    if (isGeometryAValidPolygon) {
      const isInitialPointClicked = !!map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => point.properties.pointIndex === 0);
      if (isInitialPointClicked) {
        setTimeout(() => dispatch(setGeometryPoints(geometryPoints)), TIMEOUT_TO_REMOVE_REDUNDANT_POINT);
        setIsDrawing(false);
      }
    }
  }, [dispatch, geometryPoints, isGeometryAValidPolygon, map]);

  const onDoubleClick = useCallback(() => isGeometryAValidPolygon && setIsDrawing(false), [isGeometryAValidPolygon]);

  const onSaveGeometry = useCallback(() => {
    dispatch(setIsPickingLocation(false));
  }, [dispatch]);

  useMapEventBinding('dblclick', onDoubleClick, null, isDrawing);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Enter':
        return isGeometryAValidPolygon && setIsDrawing(false);
      case 'Escape':
        setMapDrawingData(null);
        return dispatch(setIsPickingLocation(false));
      case 'Backspace':
        return isDrawing && onUndo();
      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isDrawing, isGeometryAValidPolygon, map, onUndo, setMapDrawingData]);

  useEffect(() => {
    if (event?.geometry) {
      const eventPolygon = event.geometry.type === 'FeatureCollection'
        ? event.geometry.features[0]
        : event.geometry;

      map.fitBounds(bbox(eventPolygon), { padding: VERTICAL_POLYGON_PADDING });

      dispatch(setGeometryPoints(eventPolygon.geometry.coordinates[0].slice(0, -1)));
      setTimeout(() => dispatch(reset(REPORT_GEOMETRY_UNDOABLE_NAMESPACE)));
      setIsDrawing(false);
    }
  }, [dispatch, event.geometry, map]);

  useEffect(() => {
    const isGeometryAPolygon = geometryPoints.length > 2;
    if (!isDrawing && !isGeometryAPolygon) {
      setIsDrawing(true);
    }
  }, [geometryPoints.length, isDrawing]);

  useEffect(() => () => dispatch(setGeometryPoints([])), [dispatch]);

  return <>
    <ReportOverview
      isDiscardButtonDisabled={!geometryPoints.length}
      isUndoButtonDisabled={!canUndo}
      onClickDiscard={onClickDiscard}
      onClickUndo={onUndo}
    />
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
