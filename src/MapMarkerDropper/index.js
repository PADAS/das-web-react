import React, { memo, useContext, useState, useEffect, useRef } from 'react';
import throttle from 'lodash/throttle';

import { addMapImage } from '../utils/map';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { validateLocation } from '../utils/location';

import MouseMarkerLayer from '../MouseMarkerLayer';
import MouseMarkerPopup from '../MouseMarkerPopup';
import PickMapLocationButton from '../PickMapLocationButton';

import MarkerImage from '../common/images/icons/marker-feed.svg';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapMarkerDropper = ({ onMarkerDropped = null, showMarkerPopup = true, ...rest }) => {
  const map = useContext(MapContext);

  const [moving, setMovingState] = useState(false);
  const [location, setMarkerLocation] = useState({});
  const [shouldCleanUpOnNextMapClick, setCleanupState] = useState(false);

  const isValidLocation = validateLocation(location);
  const shouldShowMarkerLayer = moving || isValidLocation;

  const cleanupMarkerStateFromMap = () => {
    hideMarker();
    setCleanupState(false);
  };

  const hideMarker = () => {
    setMarkerLocation({});
    stopMovingReportMarker();

    mapInteractionTracker.track('Dismiss \'Drop Marker\'');
  };

  const onMouseMove = throttle((e) => {
    setMarkerLocation(e.lngLat);
  }, 50);

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
    if (onMarkerDropped && !moving && isValidLocation) {
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

    mapInteractionTracker.track('Click \'Drop Marker\' button');
  };

  const onLocationSelect = () => {
    stopMovingReportMarker();
    setCleanupState(true);

    mapInteractionTracker.track('Place \'Drop Marker\' to Create Report');
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

  return <>
    <PickMapLocationButton
      className={styles.mapControl}
      disabled={isValidLocation || moving}
      onCancel={hideMarker}
      onClick={startMovingReportMarker}
      onPick={onLocationSelect}
      showInstructionsPopup={false}
    />

    {shouldShowMarkerLayer && <>
      <MouseMarkerLayer location={location} {...rest} />
      {showMarkerPopup && moving && <MouseMarkerPopup location={location} />}
    </>}
  </>;
};

export default memo(MapMarkerDropper);
