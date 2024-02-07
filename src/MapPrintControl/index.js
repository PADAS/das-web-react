import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-icon.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { setPrintTitle } from '../ducks/map-ui';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapPrintControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-controls', { keyPrefix: 'mapPrintControl' });

  const printTitle = useSelector((state) => state.view.printTitle);

  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);

  const [active, setActiveState] = useState(false);

  const onAfterPrint = useCallback(() => setActiveState(false), []);

  const toggleActiveState = useCallback(() => setActiveState(!active), [active]);

  const onInputChange = ({ target: { value } }) => dispatch(setPrintTitle(value));

  const onPrintFormSubmit = (event) => {
    event.preventDefault();

    mapInteractionTracker.track('Print Map');
    window.print();
    toggleActiveState();
  };

  useEffect(() => {
    window.removeEventListener('afterprint', onAfterPrint);
    window.addEventListener('afterprint', onAfterPrint);

    return () => {
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [onAfterPrint]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        toggleActiveState();
      }
    };

    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        toggleActiveState();
      }
    };

    if (active) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);

      mapInteractionTracker.track('Open \'Print Dialog\'');
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };

  }, [active, toggleActiveState]);

  return <div className={styles.wrapper} ref={wrapperRef}>
    <button
      onClick={toggleActiveState}
      ref={buttonRef}
      type='button'
      title={t('printButtonTitle')}
      className={`${styles.button} ${active ? styles.active : ''}`}
    >
      <PrinterIcon title={t('printButtonTitle')} />
    </button>

    <Overlay
      show={active}
      target={buttonRef.current}
      container={wrapperRef.current}
      placement='left'
    >
      <Popover placement='left'>
        <Popover.Body>
          <form className={styles.form} onSubmit={onPrintFormSubmit}>
            <label>
              <span>{t('documentTitle')}</span>
              <input type='text' value={printTitle} onChange={onInputChange} />
            </label>

            <Button size='sm' variant='dark' type='submit'>
              {t('printButton')}
            </Button>

            <small>{t('printInstructions')}</small>
          </form>
        </Popover.Body>
      </Popover>
    </Overlay>
  </div>;
};

export default memo(MapPrintControl);