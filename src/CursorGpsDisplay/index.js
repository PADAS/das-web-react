import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import throttle from 'lodash/throttle';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('map-controls', { keyPrefix: 'cursorGPSDisplay' });

  const map = useContext(MapContext);

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const dropdownRef = useRef(null);

  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [gpsInputValue, setGpsInputValue] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    if (map) {
      const onMouseMove = (event) => setCursorCoordinates(event.lngLat);
      const onMouseMoveThrottle = throttle(onMouseMove, 50);

      map.on('mousemove', onMouseMoveThrottle);

      return () => map.off('mousemove', onMouseMoveThrottle);
    }
  }, [map]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return <Dropdown
      align="end"
      data-testid="cursorGpsDisplay-dropdown"
      onToggle={() => setIsOpen(!isOpen)}
      ref={dropdownRef}
      show={isOpen}
    >
    <Dropdown.Toggle className={styles.container} title={t('toggleTitle')}>
      <div className={styles.searchIcon}>
        <SearchIcon title={t('titleIconSearch')} />
      </div>

      {isValidLocation && calcGpsDisplayString(cursorCoordinates.lat, cursorCoordinates.lng, gpsFormat)}
    </Dropdown.Toggle>

    <Dropdown.Menu className={styles.menu}>
      <GpsInput
        className={styles.gpsInput}
        id="cursorGpsDisplay-gpsInput"
        onChange={setGpsInputValue}
        onKeyDown={(event) => event.key === 'Enter' && onSearchCoordinates()}
        renderButton={() => <Button
          aria-label={t('gpsInputButtonLabel')}
          className={styles.gpsInputButton}
          onClick={onGPSInputButtonClick}
          title={t('gpsInputButtonLabel')}
          variant="light"
        >
          <SearchIcon className={styles.searchIcon} />
        </Button>}
        title={t('gpsDisplayTooltip')}
        value={gpsInputValue}
      />
    </Dropdown.Menu>
  </Dropdown>;
};

export default CursorGpsDisplay;
