import React, { memo, useContext, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';
import { setIsPickingLocation } from '../ducks/map-ui';

import Popup from '../Popup';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapLocationPicker = ({
  className,
  disabled,
  onLocationSelect,
  onLocationSelectCancel,
  onLocationSelectStart,
  showCancelButton,
  showPopup,
  wrapperClassName,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'mapLocationPicker' });

  const map = useContext(MapContext);

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

  const clickFunc = useRef(null);
  const keydownFunc = useRef((event) => {
    event.preventDefault();
    event.stopPropagation();

    onCancel();
  });

  const unbindMapEvents = () => {
    map.off('click', clickFunc.current);
    document.removeEventListener('keydown', keydownFunc.current);
  };

  const onCancel = () => {
    dispatch(setIsPickingLocation(false));
    unbindMapEvents();
    onLocationSelectCancel?.();

    mapInteractionTracker.track('Dismiss \'Drop Marker\'');
  };

  const onSelect = (e) => {
    dispatch(setIsPickingLocation(false));
    unbindMapEvents();
    onLocationSelect(e);

    mapInteractionTracker.track('Place \'Drop Marker\' to Create Report');
  };

  const onSelectStart = () => {
    dispatch(setIsPickingLocation(true));

    map.on('click', onSelect);
    clickFunc.current = onSelect;
    document.addEventListener('keydown', keydownFunc.current);

    onLocationSelectStart?.();

    mapInteractionTracker.track('Click \'Drop Marker\' button');
  };

  return <>
    <div className={wrapperClassName}>
      {showCancelButton && <Button
        id="cancel-location-select"
        onClick={onCancel}
        size="sm"
        type="button"
        variant="dark"
      >
        {t('cancelButton')}
      </Button>}

      <button
        className={`${className} controlButton`}
        disabled={disabled}
        onClick={onSelectStart}
        title={t('selectLocationButtonTitle')}
        type="button"
      >
        <LocationIcon />

        <span>{t('selectLocationButtonLabel')}</span>
      </button>
    </div>

    {showPopup && isPickingLocation && <Popup
        anchor="left"
        className={styles.popup}
        map={map}
        offset={[-8, 0]}
        trackPointer={true}
      >
      <p>{t('popupLabel')}</p>
    </Popup>}
  </>;
};

MapLocationPicker.defaultProps = {
  className: '',
  disabled: false,
  showCancelButton: false,
  showPopup: true,
  wrapperClassName: '',
};

MapLocationPicker.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onLocationSelect: PropTypes.func.isRequired,
  onLocationSelectStart: PropTypes.func.isRequired,
  onLocationSelectCancel: PropTypes.func.isRequired,
  showCancelButton: PropTypes.bool,
  showPopup: PropTypes.bool,
  wrapperClassName: PropTypes.string,
};

export default memo(MapLocationPicker);
