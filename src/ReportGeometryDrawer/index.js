import React, { memo, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import bbox from '@turf/bbox';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import reportGeometryReducer, { reset, setGeometryPoints, undo } from '../ducks/report-geometry';
import { setIsPickingLocation } from '../ducks/map-ui';
import { useMapEventBinding } from '../hooks';
import { validateEventPolygonPoints } from '../utils/geometry';

import CancelationConfirmationModal from './CancelationConfirmationModal';
import Footer from './Footer';
import InformationModal from './InformationModal';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const VERTICAL_POLYGON_PADDING = 100;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);

  const [reportGeometry, dispatchReportGeometry] = useReducer(
    reportGeometryReducer,
    { past: [], current: { points: [] }, future: [] }
  );

  const map = useContext(MapContext);
  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const [isDrawing, setIsDrawing] = useState(true);
  const [showCancellationConfirmationModal, setShowCancellationConfirmationModal] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);

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
      dispatchReportGeometry(undo());

      const isPastGeometryAPolygon = reportGeometry.past.at(-1).points.length > 2;
      if (!isPastGeometryAPolygon && !isDrawing) {
        return setIsDrawing(true);
      }

      const undoingDiscard = points.length === 0;
      if (undoingDiscard && isPastGeometryAPolygon && isDrawing) {
        return setIsDrawing(false);
      }
    }
  }, [canUndo, isDrawing, points.length, reportGeometry.past]);

  const onCancel = useCallback(() => {
    let originalPoints = [];
    if (event?.geometry) {
      const eventPolygon = event.geometry.type === 'FeatureCollection'
        ? event.geometry.features[0]
        : event.geometry;

      originalPoints = eventPolygon.geometry.coordinates[0].slice(0, -1);
    }

    const didUserMakeChanges = !isEqual(points, originalPoints);
    const isAModalOpen = showInformationModal;
    if (!isAModalOpen) {
      if (didUserMakeChanges) {
        setShowCancellationConfirmationModal(true);
      } else {
        setMapDrawingData(null);
        dispatch(setIsPickingLocation(false));
      }
    }
  }, [dispatch, event?.geometry, points, setMapDrawingData, showInformationModal]);

  const onChangeGeometry = useCallback((newPoints) => {
    const isNewGeometryAPolygon = newPoints.length > 2;

    if (isDrawing || isNewGeometryAPolygon) {
      dispatchReportGeometry(setGeometryPoints(newPoints));
    }
  }, [isDrawing]);

  const onClickPoint = useCallback((event) => {
    if (isDrawing) {
      const isInitialPointClicked = !!map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => point.properties.pointIndex === 0);
      if (isInitialPointClicked) {
        setIsDrawing(false);
      }
    }
  }, [isDrawing, map]);

  const onDoubleClick = useCallback(() => setIsDrawing(false), []);

  const onSaveGeometry = useCallback(() => {
    dispatch(setIsPickingLocation(false));
  }, [dispatch]);

  const onHideCancellationConfirmationModal = useCallback(() => setShowCancellationConfirmationModal(false), []);

  const onShowInformationModal = useCallback(() => setShowInformationModal(true), []);

  const onHideInformationModal = useCallback(() => setShowInformationModal(false), []);

  useMapEventBinding('dblclick', onDoubleClick, null, isDrawing);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Enter':
        return setIsDrawing(false);

      case 'Escape':
        return onCancel();

      case 'Backspace':
      case 'Delete':
        return isDrawing && onUndo();

      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, isGeometryAValidPolygon, onCancel, onUndo]);

  useEffect(() => {
    if (event?.geometry) {
      const eventPolygon = event.geometry.type === 'FeatureCollection'
        ? event.geometry.features[0]
        : event.geometry;

      map.fitBounds(bbox(eventPolygon), { padding: VERTICAL_POLYGON_PADDING });

      dispatchReportGeometry(setGeometryPoints(eventPolygon.geometry.coordinates[0].slice(0, -1)));
      setTimeout(() => dispatchReportGeometry(reset()));
      setIsDrawing(false);
    }
  }, [event.geometry, map]);

  return <>
    <ReportOverview
      isDiscardButtonDisabled={!points.length}
      isUndoButtonDisabled={!canUndo}
      onClickDiscard={onClickDiscard}
      onClickUndo={onUndo}
      onShowInformationModal={onShowInformationModal}
    />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      points={points}
    />
    <InformationModal onHide={onHideInformationModal} show={showInformationModal} />
    <CancelationConfirmationModal
      onHide={onHideCancellationConfirmationModal}
      show={showCancellationConfirmationModal}
    />
    <Footer isDrawing={isDrawing} isGeometryAValidPolygon={isGeometryAValidPolygon} onCancel={onCancel} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
