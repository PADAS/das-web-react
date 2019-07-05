import React, { Fragment, memo, useState, useEffect, useRef } from 'react';

import { withMap } from '../EarthRangerMap';

import { validateLngLat } from '../utils/location';
import { imgElFromSrc } from '../utils/img';

import MapLocationPicker from '../MapLocationPicker';
import MouseMarkerLayer from '../MouseMarkerLayer';

import MarkerImage from '../common/images/icons/marker-feed.svg';

const MapMarkerDropper = ({ map, ...rest }) => {
  const [moving, setMovingState] = useState(false);
  const [location, setMarkerLocation] = useState({});
  const [shouldCleanUpOnNextMapClick, setCleanupState] = useState(false);
  
  const addImageToMap = async () => {
    if (!map.hasImage('marker-icon')) {
      const img = await imgElFromSrc(MarkerImage);
      map.addImage('marker-icon', img);
    }
  };
  
  const cleanupMarkerStateFromMap = () => {
    setMovingState(false);
    setMarkerLocation({});
    setCleanupState(false);
  };

  const cleanupFunc = useRef(cleanupMarkerStateFromMap);

  useEffect(() => {
    if (shouldCleanUpOnNextMapClick) {
      map.on('click', cleanupFunc.current);
    } else {
      map.off('click', cleanupFunc.current);
    }
  }, [shouldCleanUpOnNextMapClick]);

  useEffect(() => {
    addImageToMap();
  }, []);

  const isValidLocation = validateLngLat(location.lng, location.lat);
  const shouldShowMarkerLayer = moving || isValidLocation;

  const onLocationSelectCancel = () => {
    setMovingState(false);
    setMarkerLocation({});
  };

  const stopMovingReportMarker = () => {
    setMovingState(false);
    map.off('mousemove', onMouseMove);
  };
  const startMovingReportMarker = () => {
    setMovingState(true);
    map.on('mousemove', onMouseMove);
  };

  const onLocationSelect = () => {
    stopMovingReportMarker();
    setCleanupState(true);
  };

  const onMouseMove = (e) => {
    setMarkerLocation(e.lngLat);
  };

  return <Fragment>
    <div className='buttons'>
      <MapLocationPicker
        onLocationSelectCancel={onLocationSelectCancel}
        onLocationSelectStart={startMovingReportMarker}
        onLocationSelect={onLocationSelect} />

      {moving && <button type='button' onClick={onLocationSelectCancel}>Cancel</button>}
    </div>

    {shouldShowMarkerLayer && <MouseMarkerLayer location={location} />}

  </Fragment>;
};

export default memo(withMap(MapMarkerDropper));