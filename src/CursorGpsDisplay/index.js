import React, { useContext, useEffect, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import throttle from 'lodash/throttle';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import { calcGpsDisplayString, validateLocation } from '../utils/location';

import { MapContext } from '../App';
import MenuPopover from './MenuPopover';

import styles from './styles.module.scss';

const CursorGpsDisplay = () => {
  const { t } = useTranslation('map-controls', { keyPrefix: 'cursorGPSDisplay' });

  const map = useContext(MapContext);

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const buttonRef = useRef();

  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);

  const isValidLocation = validateLocation(cursorCoordinates);

  useEffect(() => {
    if (map) {
      // When the user moves the cursor, update its coordinates in the display every 50ms.
      const onMouseMove = (event) => setCursorCoordinates(event.lngLat);
      const onMouseMoveThrottle = throttle(onMouseMove, 50);

      map.on('mousemove', onMouseMoveThrottle);

      return () => map.off('mousemove', onMouseMoveThrottle);
    }
  }, [map]);

  return <>
    <button
        aria-controls="cursorGpsDisplay-menuPopover"
        aria-expanded={isMenuPopoverOpen}
        aria-label={t(`buttonLabel.${isMenuPopoverOpen ? 'open' : 'closed'}`)}
        className={styles.button}
        onClick={() => setIsMenuPopoverOpen(!isMenuPopoverOpen)}
        ref={buttonRef}
        title={t(`buttonLabel.${isMenuPopoverOpen ? 'open' : 'closed'}`)}
        type="button"
      >
      <div className={styles.searchIcon}>
        <SearchIcon />
      </div>

      {isValidLocation && calcGpsDisplayString(cursorCoordinates.lat, cursorCoordinates.lng, gpsFormat)}

      <div className={`${styles.caret} ${isMenuPopoverOpen ? styles.open : ''}`} role="img" />
    </button>

    <Overlay placement="bottom-end" show={isMenuPopoverOpen} target={buttonRef}>
      <MenuPopover buttonRef={buttonRef} onClose={() => setIsMenuPopoverOpen(false)} />
    </Overlay>
  </>;
};

export default CursorGpsDisplay;
