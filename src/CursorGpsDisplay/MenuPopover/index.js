import React, { useCallback, useEffect, useRef, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '../../common/images/icons/search-icon.svg';

import { showPopup } from '../../ducks/popup';
import useJumpToLocation from '../../hooks/useJumpToLocation';

import GpsInput from '../../GpsInput';

import * as styles from './styles.module.scss';

const MenuPopover = ({ buttonRef, className, onClose, ref, ...otherProps }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const { t } = useTranslation('map-controls', { keyPrefix: 'cursorGPSDisplay.menuPopover' });

  const gpsFormatToggleRef = useRef();
  const gpsInputButtonRef = useRef();
  const gpsInputRef = useRef();
  const gpsInputWrapperRef = useRef();

  const [gpsInputValue, setGpsInputValue] = useState(null);

  const onJumpToCoordinates = useCallback((coordinates = gpsInputValue) => {
    // If the GPS input value is defined, jump to the coordinates, show a dropped marker popup in the map and close the
    // menu.
    if (coordinates) {
      jumpToLocation([coordinates.longitude, coordinates.latitude]);

      setTimeout(() => dispatch(showPopup('dropped-marker', {
        coordinates: [coordinates.longitude, coordinates.latitude],
        location: { lat: coordinates.latitude, lng: coordinates.longitude },
        popupAttrsOverride: { offset: [0, 0] },
      })), 50);

      onClose();
    }
  }, [dispatch, gpsInputValue, jumpToLocation, onClose]);

  const onGpsInputPlaceSelected = (event, place) => {
    // Either if the place was selected by clicking or pressing enter, we stop
    // the propagation of the event so the GPS input keyboard events and map
    // clicking events don't get triggered.
    event.stopPropagation();

    onJumpToCoordinates(place.coordinates);
  };

  const onGpsInputKeyDown = (event) => {
    switch (event.key) {
    case 'Enter':
      event.preventDefault();

      onJumpToCoordinates();
      break;

    case 'Escape':
      event.preventDefault();

      onClose();
      break;

    default:
      break;
    }
  };

  const onGpsInputButtonClick = (event) => {
    event.stopPropagation();

    onJumpToCoordinates();
  };

  useEffect(() => {
    // Select the GPS input on mount so user can type away or navigate.
    gpsInputRef.current.select();
  }, []);

  useEffect(() => {
    // Create a focus trap while the component is mounted so only internal elements are focused when pressing tab.
    const onKeyDown = (event) => {
      if (event.key === 'Tab') {
        const lastFocusableElementRef = gpsInputValue ? gpsInputButtonRef : gpsInputRef;
        if (event.shiftKey && document.activeElement === gpsFormatToggleRef.current) {
          event.preventDefault();

          lastFocusableElementRef.current.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusableElementRef.current) {
          event.preventDefault();

          gpsFormatToggleRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [gpsInputValue]);

  useEffect(() => {
    const onPointerDown = (event) => !buttonRef.current.contains(event.target)
      && !gpsInputWrapperRef.current.contains(event.target)
      && onClose();

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [buttonRef, onClose]);

  return <Popover
      className={`${className} ${styles.menuPopover}`}
      id="cursorGpsDisplay-menuPopover"
      ref={ref}
      role="presentation"
      {...otherProps}
    >
    <GpsInput
      className={styles.gpsInput}
      gpsFormatToggleRef={gpsFormatToggleRef}
      id="cursorGpsDisplay-gpsInput"
      inputRef={gpsInputRef}
      onChange={setGpsInputValue}
      onKeyDown={onGpsInputKeyDown}
      onPlaceSelected={onGpsInputPlaceSelected}
      ref={gpsInputWrapperRef}
      renderButton={() => <button
        aria-label={t('gpsInputButtonLabel')}
        className={styles.gpsInputButton}
        disabled={!gpsInputValue}
        onClick={onGpsInputButtonClick}
        ref={gpsInputButtonRef}
        title={t('gpsInputButtonLabel')}
        type="button"
      >
        <SearchIcon className={styles.searchIcon} />
      </button>}
      showTextSearchOption
      title={t('gpsDisplayTooltip')}
      value={gpsInputValue}
    />
  </Popover>;
};

export default MenuPopover;
