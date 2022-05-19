import React, { Fragment, memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import { validateLngLat } from '../utils/location';
import { addMapImage } from '../utils/map';

import MapLocationPicker from '../MapLocationPicker';
import MouseMarkerLayer from '../MouseMarkerLayer';
import MouseMarkerPopup from '../MouseMarkerPopup';

import MarkerImage from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';

const MapMarkerDropper = ({ map, onMarkerDropped, showMarkerPopup = true, ...rest }) => {
  const [moving, setMovingState] = useState(false);
  const [location, setMarkerLocation] = useState({});
  const [shouldCleanUpOnNextMapClick, setCleanupState] = useState(false);

  const isValidLocation = location.lng && location.lat && validateLngLat(location.lng, location.lat);
  const shouldShowMarkerLayer = moving || isValidLocation;

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
  }, [map, shouldCleanUpOnNextMapClick]);

  useEffect(() => {
    if (!!map && !map.hasImage('marker-icon')) {
      addMapImage({ src: MarkerImage, id: 'marker-icon' });
    }
  }, [map]);

  useEffect(() => {
    if (!moving && isValidLocation) {
      onMarkerDropped(location);
    }
  }, [isValidLocation, location, moving, onMarkerDropped]);

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


  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        stopMovingReportMarker();
      }
    };
    if (moving) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);

  }, [moving]); // eslint-disable-line



  return <Fragment>
    <MapLocationPicker
      disabled={isValidLocation || moving}
      showCancelButton={moving}
      className={styles.mapControl}
      wrapperClassName={styles.buttons}
      onLocationSelectCancel={hideMarker}
      onLocationSelectStart={startMovingReportMarker}
      onLocationSelect={onLocationSelect} />

    {shouldShowMarkerLayer && <>
      <MouseMarkerLayer location={location} {...rest} />
      {showMarkerPopup && moving && <MouseMarkerPopup location={location} />}
    </>}
  </Fragment>;
};

export default memo(withMap(MapMarkerDropper));

MapMarkerDropper.defaultProps = {
  onMarkerDropped() {
  },
};

MapMarkerDropper.propTypes = {
  onMarkerDropped: PropTypes.func,
};