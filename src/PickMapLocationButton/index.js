import React, { forwardRef, memo, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import { MapContext } from '../App';
import { setIsPickingLocation } from '../ducks/map-ui';

import Popup from '../Popup';

import styles from './styles.module.scss';

const PickMapLocationButton = ({
  onCancel,
  onClick,
  onPick,
  renderContent,
  showInstructionsPopup = true,
  ...otherProps
}, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'pickMapLocationButton' });

  const map = useContext(MapContext);

  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);

  const onMapClick = useRef((event) => {
    map.off('click', onMapClick.current);
    document.removeEventListener('keydown', onKeyDown.current);

    dispatch(setIsPickingLocation(false));

    onPick(event);
  });

  const onKeyDown = useRef((event) => {
    event.preventDefault();
    event.stopPropagation();

    map.off('click', onMapClick.current);
    document.removeEventListener('keydown', onKeyDown.current);

    dispatch(setIsPickingLocation(false));

    onCancel?.();
  });

  const onButtonClick = () => {
    map.on('click', onMapClick.current);
    document.addEventListener('keydown', onKeyDown.current);

    dispatch(setIsPickingLocation(true));

    onClick?.();
  };

  return <>
    <button
        aria-label={t('pickLocationButtonLabel')}
        title={t('pickLocationButtonLabel')}
        {...otherProps}
        onClick={onButtonClick}
        ref={ref}
        type="button"
      >
      {renderContent?.() || <LocationIcon />}
    </button>

    {showInstructionsPopup && isPickingLocation && <Popup
        anchor="left"
        className={styles.instructionsPopup}
        map={map}
        offset={[-8, 0]}
        trackPointer={true}
      >
      <p>{t('instructionsPopupLabel')}</p>
    </Popup>}
  </>;
};

export default memo(forwardRef(PickMapLocationButton));
