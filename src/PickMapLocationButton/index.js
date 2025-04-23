import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import { hideSideBar, showSideBar } from '../ducks/side-bar';
import { MapContext } from '../App';
import { setIsPickingLocation } from '../ducks/map-ui';
import { setModalVisibilityState } from '../ducks/modals';

import Popup from '../Popup';

import * as styles from './styles.module.scss';

const PickMapLocationButton = ({
  onCancel = null,
  onClick = null,
  onPick,
  ref,
  renderContent = null,
  showInstructionsPopup = true,
  ...otherProps
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'pickMapLocationButton' });

  const map = useContext(MapContext);

  const [isPickingMapLocation, setIsPickingMapLocation] = useState(false);

  // Update the store so the application shows or hides the views over the map so the user can pick a location in it.
  const setAppToShowMapMode = useCallback((showMapMode = true) => {
    dispatch(setIsPickingLocation(showMapMode));
    dispatch(setModalVisibilityState(!showMapMode));
    dispatch(showMapMode ? hideSideBar() : showSideBar());
  }, [dispatch]);

  const onButtonClick = () => {
    setAppToShowMapMode();
    setIsPickingMapLocation(true);

    onClick?.();
  };

  useEffect(() => {
    // If user starts picking a map location attach the map click listener and a key down listener to cancel the
    // operation and make sure to clean the listeners.
    if (isPickingMapLocation) {
      const onMapClick = (event) => {
        setAppToShowMapMode(false);
        setIsPickingMapLocation(false);

        onPick(event);
      };

      const onKeyDown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setAppToShowMapMode(false);
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
  }, [isPickingMapLocation, map, onCancel, onPick, setAppToShowMapMode]);

  return <>
    <button
        aria-label={t('pickLocationButtonLabel')}
        onClick={onButtonClick}
        ref={ref}
        title={t('pickLocationButtonLabel')}
        type="button"
        {...otherProps}
      >
      {renderContent?.() || <LocationIcon data-testid="location-icon" />}
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

export default memo(PickMapLocationButton);
