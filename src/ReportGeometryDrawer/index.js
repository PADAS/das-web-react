import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { LAYER_IDS } from '../MapDrawingTools/MapLayers';
import { MapContext } from '../App';
import { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { setIsPickingLocation } from '../ducks/map-ui';

import Footer from './Footer';
import ReportOverview from './ReportOverview';
import MapDrawingTools from '../MapDrawingTools';

const TIMEOUT_TO_REMOVE_REDUNDANT_POINT = 150;

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);

  const map = useContext(MapContext);

  const { mapDrawingData, setMapDrawingData } = useContext(MapDrawingToolsContext);

  // TODO: Set the current event polygon by default
  const [isDrawing, setIsDrawing] = useState(true);

  const isGeometryAValidPolygon = mapDrawingData?.geometryPoints?.length > 2;

  const onChangeGeometry = useCallback((newPoints, newGeoJson) => {
    setMapDrawingData({ geometryPoints: newPoints, geoJson: newGeoJson });
  }, [setMapDrawingData]);

  const onClickPoint = useCallback((event) => {
    if (isGeometryAValidPolygon) {
      const isInitialPointClicked = !!map.queryRenderedFeatures(event.point, { layers: [LAYER_IDS.POINTS] })
        .find((point) => point.properties.pointIndex === 0);
      if (isInitialPointClicked) {
        setTimeout(() => setMapDrawingData(mapDrawingData), TIMEOUT_TO_REMOVE_REDUNDANT_POINT);
        setIsDrawing(false);
      }
    }
  }, [isGeometryAValidPolygon, map, mapDrawingData, setMapDrawingData]);

  const onSaveGeometry = useCallback(() => {
    setMapDrawingData({ ...mapDrawingData, finished: true });
    dispatch(setIsPickingLocation(false));
  }, [dispatch, mapDrawingData, setMapDrawingData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
      case 'Backspace':
        return isDrawing && mapDrawingData?.geometryPoints?.length && setMapDrawingData(
          { ...mapDrawingData,
            geometryPoints: mapDrawingData.geometryPoints.slice(0, -1),
          });
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
  }, [dispatch, isDrawing, isGeometryAValidPolygon, mapDrawingData, setMapDrawingData]);

  useEffect(() => {
    if (event?.geometry) {
      if (event.geometry.type === 'FeatureCollection') {
        setMapDrawingData({ geometryPoints: event.geometry.features[0].geometry.coordinates[0].slice(0, -1) });
      } else {
        setMapDrawingData({ geometryPoints: event.geometry.geometry.coordinates[0].slice(0, -1) });
      }

      setIsDrawing(false);
    } else {
      setMapDrawingData(null);
    }
  }, [event.geometry, setMapDrawingData]);

  return <>
    <ReportOverview
      area={mapDrawingData?.geoJson?.fillLabelPoint?.properties?.areaLabel}
      perimeter={mapDrawingData?.geoJson?.drawnLineSegments?.properties?.lengthLabel}
    />
    <MapDrawingTools
      drawing={isDrawing}
      onChange={onChangeGeometry}
      onClickPoint={onClickPoint}
      onCompleteDrawing={onChangeGeometry}
      points={mapDrawingData?.geometryPoints || []}
    />
    <Footer disableSaveButton={isDrawing} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);
