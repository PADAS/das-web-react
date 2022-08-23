import React, { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setIsPickingLocation, setMapLocationSelectionData } from '../ducks/map-ui';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  // TODO: Set the current event polygon by default
  const [geometryPoints, setGeometryPoints] = useState([]);
  const [geoJson, setGeoJson] = useState(null);
  const [isDrawing, setIsDrawing] = useState(true);

  const onChangeGeometry = useCallback((newPoints) => setGeometryPoints(newPoints), []);

  const onGeoJsonChange = useCallback((newGeoJson) => setGeoJson(newGeoJson), []);

  const onSaveGeometry = useCallback(() => {
    dispatch(setMapLocationSelectionData(geoJson));
    dispatch(setIsPickingLocation(false));
  }, [dispatch, geoJson]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Backspace':
        return isDrawing && geometryPoints.length && setGeometryPoints(geometryPoints.slice(0, -1));
      case 'Enter':
        return geometryPoints.length > 2 && setIsDrawing(false);
      case 'Escape':
        return dispatch(setIsPickingLocation(false));
      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, geometryPoints, isDrawing]);

  return <>
    <ReportOverview />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onGeoJsonChange={onGeoJsonChange}
      points={geometryPoints}
    />
    <Footer disableSaveButton={isDrawing} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
