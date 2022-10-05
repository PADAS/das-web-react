import React, { memo, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import bbox from '@turf/bbox';
import { useDispatch, useSelector } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import reportGeometryReducer, {
  REPORT_GEOMETRY_UNDOABLE_NAMESPACE,
  setGeometryPoints,
} from '../ducks/report-geometry';
import { setIsPickingLocation } from '../ducks/map-ui';
import undoableReducer, { reset, undo } from '../reducers/undoable';
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

  const [reportGeometry, dispatchReportGeometry] = useReducer(
    undoableReducer(reportGeometryReducer, REPORT_GEOMETRY_UNDOABLE_NAMESPACE),
    { past: [], current: { points: [] }, future: [] }
  );

  const map = useContext(MapContext);
  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const [isDrawing, setIsDrawing] = useState(true);

  const canUndo = !!reportGeometry.past.length;
  const points = reportGeometry.current.points;

  const isGeometryAValidPolygon = points.length > 2
    && validateEventPolygonPoints([...points, points[0]]);

  const onClickDiscard = useCallback(() => {
    dispatchReportGeometry(setGeometryPoints([]));
    setIsDrawing(true);
  }, []);

  const onUndo = useCallback(() => {
    if (canUndo) {
      dispatchReportGeometry(undo(REPORT_GEOMETRY_UNDOABLE_NAMESPACE));

      console.log(reportGeometry.past);
      const isPastGeometryAPolygon = reportGeometry.past[reportGeometry.past.length - 1].points.length > 2;
      const undoingDiscard = points.length === 0;
      if (!isPastGeometryAPolygon) {
        setIsDrawing(true);
      } else if (undoingDiscard) {
        setIsDrawing(false);
      }
    }
  }, [canUndo, points.length, reportGeometry.past]);

  const onChangeGeometry = useCallback((newPoints) => {
    const isNewGeometryAPolygon = newPoints.length > 2;

    if (isDrawing || isNewGeometryAPolygon) {
      dispatchReportGeometry(setGeometryPoints(newPoints));
    }
  }, [isDrawing]);

  const disableSaveButton = useMemo(() =>
    isDrawing || !isGeometryAValidPolygon
  , [isGeometryAValidPolygon, isDrawing]);

  const onClickPoint = useCallback((event) => {
    if (isGeometryAValidPolygon) {
      const isInitialPointClicked = !!map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => point.properties.pointIndex === 0);
      if (isInitialPointClicked) {
        setTimeout(
          () => dispatchReportGeometry(setGeometryPoints(points)),
          TIMEOUT_TO_REMOVE_REDUNDANT_POINT
        );
        setIsDrawing(false);
      }
    }
  }, [isGeometryAValidPolygon, map, points]);

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

      dispatchReportGeometry(setGeometryPoints(eventPolygon.geometry.coordinates[0].slice(0, -1)));
      setTimeout(() => dispatchReportGeometry(reset(REPORT_GEOMETRY_UNDOABLE_NAMESPACE)));
      setIsDrawing(false);
    }
  }, [event.geometry, map]);

  return <>
    <ReportOverview
      isDiscardButtonDisabled={!points.length}
      isUndoButtonDisabled={!canUndo}
      onClickDiscard={onClickDiscard}
      onClickUndo={onUndo}
    />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      points={points}
    />
    <Footer disableSaveButton={disableSaveButton} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
