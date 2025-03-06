import React, { forwardRef, memo, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import { hideSideBar, showSideBar } from '../ducks/side-bar';
import { setIsPickingLocation } from '../ducks/map-ui';
import { MapContext } from '../App';
import { setModalVisibilityState } from '../ducks/modals';

import Popup from '../Popup';

import styles from './styles.module.scss';

const PickMapLocationButton = ({
  onCancel = null,
  onClick = null,
  onPick,
  renderContent = null,
  showInstructionsPopup = true,
  ...otherProps
}, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'pickMapLocationButton' });

  const map = useContext(MapContext);

  const [isPickingMapLocation, setIsPickingMapLocation] = useState(false);

  const onButtonClick = () => {
    // Update the store so the application is aware that user is picking a location in the map, it hides the modals and
    // the sidebar.
    dispatch(setIsPickingLocation(true));
    dispatch(setModalVisibilityState(false));
    dispatch(hideSideBar());

    setIsPickingMapLocation(true);

    onClick?.();
  };

  useEffect(() => {
    // If user starts picking a map location attach the map click listener and a key down listener to cancel the
    // operation and make sure to clean the listeners.
    if (isPickingMapLocation) {
      const onMapClick = (event) => {
        dispatch(setIsPickingLocation(false));
        dispatch(setModalVisibilityState(true));
        dispatch(showSideBar());

        setIsPickingMapLocation(false);

        onPick(event);
      };

      const onKeyDown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        dispatch(setIsPickingLocation(false));
        dispatch(setModalVisibilityState(true));
        dispatch(showSideBar());

        setIsPickingMapLocation(false);

        onCancel?.();
      };

      map.on('click', onMapClick);
      document.addEventListener('keydown', onKeyDown);

      return () => {
        map.off('click', onMapClick);
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [dispatch, isPickingMapLocation, map, onCancel, onPick]);

  return <>
    <button
        aria-label={t('pickLocationButtonLabel')}
        onClick={onButtonClick}
        ref={ref}
        title={t('pickLocationButtonLabel')}
        type="button"
        {...otherProps}
      >
      {renderContent?.() || <LocationIcon />}
    </button>

    {showInstructionsPopup && isPickingMapLocation && <Popup
        anchor="left"
        className={styles.instructionsPopup}
        map={map}
        offset={[-8, 0]}
        trackPointer
      >
      <p className={styles.text}>{t('instructionsPopupLabel')}</p>
    </Popup>}
  </>;
};

export default memo(forwardRef(PickMapLocationButton));
