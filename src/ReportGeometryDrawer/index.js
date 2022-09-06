import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { setIsPickingLocation } from '../ducks/map-ui';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const { setMapDrawingData } = useContext(MapDrawingToolsContext);

  const geoJson = useRef();

  // TODO: Set the current event polygon by default
  const [geometryPoints, setGeometryPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);

  const onChangeGeometry = useCallback((newPoints, newGeoJson) => {
    setGeometryPoints(newPoints);
    geoJson.current = newGeoJson;
  }, []);

  const onSaveGeometry = useCallback(() => {
    setMapDrawingData(geoJson.current);
    dispatch(setIsPickingLocation(false));
  }, [dispatch, setMapDrawingData]);

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
    <MapDrawingTools drawing={isDrawing} onChange={onChangeGeometry} points={geometryPoints} />
    <Footer disableSaveButton={isDrawing} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
