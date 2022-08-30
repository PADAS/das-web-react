import React, { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setIsPickingLocation } from '../ducks/map-ui';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  // TODO: Set the current event polygon by default
  const [geometryPoints, setGeometryPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);

  const onChangeGeometry = useCallback((newPoints) => {
    setGeometryPoints(newPoints);
  }, []);

  const onClickGeometryLine = useCallback(() => {
    console.log('Line clicked');
  }, []);

  const onClickGeometryPoint = useCallback(() => {
    console.log('Point clicked');
  }, []);

  const onSaveGeometry = useCallback(() => {

  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Backspace':
        return setGeometryPoints(geometryPoints.slice(0, -1));
      case 'Enter':
        setGeometryPoints([...geometryPoints, geometryPoints[geometryPoints.length - 1]]);
        return setIsDrawing(false);
      case 'Escape':
        return dispatch(setIsPickingLocation(false));
      default:
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, geometryPoints]);

  return <>
    <ReportOverview />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickLine={onClickGeometryLine}
      onClickPoint={onClickGeometryPoint}
      points={geometryPoints}
    />
    <Footer disableSaveButton={!geometryPoints.length} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
