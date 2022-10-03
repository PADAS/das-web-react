import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import { useDispatch, useSelector } from 'react-redux';

import { addModal } from '../ducks/modals';
import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { setIsPickingLocation } from '../ducks/map-ui';
import { useMapEventBinding } from '../hooks';
import { validateEventPolygonPoints } from '../utils/geometry';

import CancelationConfirmationModal from './CancelationConfirmationModal';
import Footer from './Footer';
import InformationModal from './InformationModal';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const TIMEOUT_TO_REMOVE_REDUNDANT_POINT = 150;
const VERTICAL_POLYGON_PADDING = 100;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);

  const map = useContext(MapContext);

  const [geometryPoints, setGeometryPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [showInformationModal, setShowInformationModal] = useState(false);

  const isGeometryAValidPolygon = geometryPoints.length > 2 && validateEventPolygonPoints([...geometryPoints, geometryPoints[0]]);

  const onCancel = useCallback(() => {
    const isAModalOpen = showInformationModal;
    if (!isAModalOpen) {
      dispatch(addModal({ content: CancelationConfirmationModal, forceShowModal: true }));
    }
  }, [dispatch, showInformationModal]);

  const onChangeGeometry = useCallback((newPoints) => {
    const isNewGeometryAValidPolygon = newPoints.length > 2;

    if (isDrawing || isNewGeometryAValidPolygon) {
      setGeometryPoints(newPoints);
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
        setTimeout(() => setGeometryPoints(geometryPoints), TIMEOUT_TO_REMOVE_REDUNDANT_POINT);
        setIsDrawing(false);
      }
    }
  }, [geometryPoints, isGeometryAValidPolygon, map]);

  const onDoubleClick = useCallback(() => isGeometryAValidPolygon && setIsDrawing(false), [isGeometryAValidPolygon]);

  const onSaveGeometry = useCallback(() => {
    dispatch(setIsPickingLocation(false));
  }, [dispatch]);

  const onShowInformationModal = useCallback(() => setShowInformationModal(true), []);

  const onHideInformationModal = useCallback(() => setShowInformationModal(false), []);

  useMapEventBinding('dblclick', onDoubleClick, null, isDrawing);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Enter':
        return isGeometryAValidPolygon && setIsDrawing(false);

      case 'Escape':
        return onCancel();

      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGeometryAValidPolygon, onCancel]);

  useEffect(() => {
    if (event?.geometry) {
      const eventPolygon = event.geometry.type === 'FeatureCollection'
        ? event.geometry.features[0]
        : event.geometry;

      map.fitBounds(bbox(eventPolygon), { padding: VERTICAL_POLYGON_PADDING });

      setGeometryPoints(eventPolygon.geometry.coordinates[0].slice(0, -1));
      setIsDrawing(false);
    }
  }, [event.geometry, map]);

  return <>
    <ReportOverview onShowInformationModal={onShowInformationModal} />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      points={geometryPoints}
    />
    <InformationModal onHide={onHideInformationModal} show={showInformationModal} />
    <Footer disableSaveButton={disableSaveButton} onCancel={onCancel} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
