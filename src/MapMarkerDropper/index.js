import React, { Fragment, memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import { validateLngLat } from '../utils/location';
import { imgElFromSrc } from '../utils/img';

import MapLocationPicker from '../MapLocationPicker';
import MouseMarkerLayer from '../MouseMarkerLayer';

import MarkerImage from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';



const MapMarkerDropper = ({ map, onMarkerDropped, doIt, ...rest }) => {
  const [moving, setMovingState] = useState(false);
  const [location, setMarkerLocation] = useState({});
  const [shouldCleanUpOnNextMapClick, setCleanupState] = useState(false);

  const isValidLocation = location.lng && location.lat && validateLngLat(location.lng, location.lat);
  const shouldShowMarkerLayer = moving || isValidLocation;
  
  const addImageToMap = async () => {
    if (!map.hasImage('marker-icon')) {
      const img = await imgElFromSrc(MarkerImage);
      map.addImage('marker-icon', img);
    }
  };
  
  const cleanupMarkerStateFromMap = () => {
    hideMarker();
    setCleanupState(false);
  };

  const hideMarker = () => {
    setMarkerLocation({});
    stopMovingReportMarker();
  };

  const onMouseMove = (e) => {
    setMarkerLocation(e.lngLat);
  };

  const cleanupFunc = useRef(cleanupMarkerStateFromMap);
  const mouseMoveFunc = useRef(onMouseMove);

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

  useEffect(() => {
    if (!moving && isValidLocation) {
      onMarkerDropped(location);
    }
  }, [moving]);

  const stopMovingReportMarker = () => {
    setMovingState(false);
    map.off('mousemove', mouseMoveFunc.current);
  };
  const startMovingReportMarker = () => {
    setMovingState(true);
    map.on('mousemove', mouseMoveFunc.current);
  };

  const onLocationSelect = () => {
    stopMovingReportMarker();
    setCleanupState(true);
  };



  return <Fragment>
    <div className={styles.buttons}>
      <MapLocationPicker
        showCancelButton={moving}
        className={styles.mapControl}
        onLocationSelectCancel={hideMarker}
        onLocationSelectStart={startMovingReportMarker}
        onLocationSelect={onLocationSelect} />
    </div>

    {shouldShowMarkerLayer && <MouseMarkerLayer location={location} {...rest} />}

  </Fragment>;
};

export default memo(withMap(MapMarkerDropper));

MapMarkerDropper.defaultProps = {
  onMarkerDropped(_location) {
  },
};

MapMarkerDropper.propTypes = {
  onMarkerDropped: PropTypes.func,
};