import React, { useCallback, useContext, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import throttle from 'lodash/throttle';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import { calcGpsDisplayString, validateLocation } from '../utils/location';
import { showPopup } from '../ducks/popup';
import useJumpToLocation from '../hooks/useJumpToLocation';

import GpsInput from '../GpsInput';
import { MapContext } from '../App';

import styles from './styles.module.scss';

const CursorGpsDisplay = () => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();

  const map = useContext(MapContext);

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [gpsInputValue, setGpsInputValue] = useState(null);

  const isValidLocation = validateLocation(cursorCoordinates);

  const onSearchCoordinates = useCallback(() => {
    if (gpsInputValue) {
      jumpToLocation(gpsInputValue);

      setTimeout(() => dispatch(showPopup('dropped-marker', {
        coordinates: gpsInputValue,
        location: { lat: gpsInputValue[1], lng: gpsInputValue[0] },
        popupAttrsOverride: { offset: [0, 0] },
      })), 50);
    }
  }, [dispatch, gpsInputValue, jumpToLocation]);

  const onGPSInputButtonClick = useCallback((event) => {
    event.stopPropagation();

    onSearchCoordinates();
  }, [onSearchCoordinates]);

  const onGPSInputChange = useCallback((location) => setGpsInputValue(location), []);

  const onGPSInputKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      onSearchCoordinates();
    }
  }, [onSearchCoordinates]);

  useEffect(() => {
    if (map) {
      const onMouseMove = (event) => setCursorCoordinates(event.lngLat);
      const onMouseMoveThrottle = throttle(onMouseMove, 50);

      map.on('mousemove', onMouseMoveThrottle);

      return () => map.off('mousemove', onMouseMoveThrottle);
    }
  }, [map]);

  if (!isValidLocation) return null;

  return <Dropdown align="end" data-testid="cursorGpsDisplay-dropdown">
    <Dropdown.Toggle className={styles.container}>
      <div className={styles.searchIcon}>
        <SearchIcon />
      </div>

      {calcGpsDisplayString(cursorCoordinates.lat, cursorCoordinates.lng, gpsFormat)}
    </Dropdown.Toggle>

    <Dropdown.Menu className={styles.menu}>
      <GpsInput
        buttonContent={<SearchIcon className={styles.searchButton} />}
        onButtonClick={onGPSInputButtonClick}
        onKeyDown={onGPSInputKeyDown}
        onValidChange={onGPSInputChange}
        tooltip="Press enter to search"
      />
    </Dropdown.Menu>
  </Dropdown>;
};

export default CursorGpsDisplay;
