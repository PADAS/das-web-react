import React, { Fragment, memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import { validateLngLat } from '../utils/location';
import { imgElFromSrc } from '../utils/img';

import MapLocationPicker from '../MapLocationPicker';
import MouseMarkerLayer from '../MouseMarkerLayer';

import MarkerImage from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';



const MapMarkerDropper = ({ map, onMarkerDropped, onMarkerHidden, ...rest }) => {
  const [initialized, setInitState] = useState(false);
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
    if (!initialized) {
      setInitState(true);
    } else if (!shouldShowMarkerLayer) {
      onMarkerHidden();
    }
  }, [shouldShowMarkerLayer]);

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
    <div className='buttons'>
      <MapLocationPicker
        className={styles.mapControl}
        onLocationSelectCancel={hideMarker}
        onLocationSelectStart={startMovingReportMarker}
        onLocationSelect={onLocationSelect} />

      {moving && <button type='button' onClick={hideMarker}>Cancel</button>}
    </div>

    {shouldShowMarkerLayer && <MouseMarkerLayer location={location} />}

  </Fragment>;
};

export default memo(withMap(MapMarkerDropper));

MapMarkerDropper.defaultProps = {
  onMarkerDropped(_location) {
  },
  onMarkerHidden() {
  },
};

MapMarkerDropper.propTypes = {
  onMarkerDropped: PropTypes.func,
  onMarkerHidden: PropTypes.func,
};