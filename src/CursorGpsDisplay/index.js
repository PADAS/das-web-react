import React, { useContext, useEffect, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import throttle from 'lodash/throttle';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import useStringifyCoordinates from '../hooks/useStringifyCoordinates';

import { MapContext } from '../MapContext';
import MenuPopover from './MenuPopover';

import * as styles from './styles.module.scss';

const CursorGpsDisplay = () => {
  const { t } = useTranslation('map-controls', { keyPrefix: 'cursorGPSDisplay' });

  const map = useContext(MapContext);

  const buttonRef = useRef();

  const [cursorCoordinates, setCursorCoordinates] = useState(null);
  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);

  const {
    coordinatesString: cursorCoordinatesString,
    outsideRepresentationBbox: cursorOutsideRepresentationBbox
  } = useStringifyCoordinates(cursorCoordinates);

  useEffect(() => {
    if (map) {
      // When the user moves the cursor, update its coordinates in the display
      // every 50ms.
      const onMouseMove = (event) => setCursorCoordinates({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
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
      <div aria-hidden className={styles.searchIcon}>
        <SearchIcon />
      </div>

      {cursorOutsideRepresentationBbox ? t('cursorCoordinatesStringOutsideBbox') : cursorCoordinatesString}

      <div aria-hidden className={`${styles.caret} ${isMenuPopoverOpen ? styles.open : ''}`} />
    </button>

    <Overlay placement="bottom-end" show={isMenuPopoverOpen} target={buttonRef}>
      <MenuPopover buttonRef={buttonRef} onClose={() => setIsMenuPopoverOpen(false)} />
    </Overlay>
  </>;
};

export default CursorGpsDisplay;
