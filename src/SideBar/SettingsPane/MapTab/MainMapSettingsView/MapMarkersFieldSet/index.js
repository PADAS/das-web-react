import React, { useEffect, useRef }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { LAYER_IDS } from '../../../../../constants';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../../../../utils/analytics';
import { toggleDisplayUserLocation, toggleMapNamesState } from '../../../../../ducks/map-ui';

import * as styles from '../../../styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapMarkersFieldSet = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.mainMapSettingsView.mapMarkersFieldSet',
  });

  const hasUserLocation = useSelector((state) => !!state.view.userLocation);
  const showMapNames = useSelector((state) => state.view.showMapNames);
  const showUserLocation = useSelector((state) => state.view.showUserLocation);

  const markerNamesAllChekboxRef = useRef();

  const isMarkerNamesFullyChecked = Object.values(showMapNames).every((markerNames) => markerNames.enabled);
  const isMarkerNamesPartiallyChecked = !isMarkerNamesFullyChecked
    && Object.values(showMapNames).some((markerNames) => markerNames.enabled);

  const onMarkerNamesAllCheckboxChange = () => {
    dispatch(toggleMapNamesState({
      [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: !isMarkerNamesFullyChecked },
      [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: !isMarkerNamesFullyChecked },
      [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: !isMarkerNamesFullyChecked },
      [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: !isMarkerNamesFullyChecked },
    }));

    mapInteractionTracker.track(`${isMarkerNamesFullyChecked ? 'Uncheck' : 'Check' } 'Show Names' checkbox`);
  };

  const onMarkerNamesCheckboxChange = (markerNamesKey) => (event) => {
    dispatch(toggleMapNamesState({
      ...showMapNames,
      [markerNamesKey]: {
        ...showMapNames[markerNamesKey],
        enabled: event.target.checked,
      },
    }));

    mapInteractionTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Marker names: ${markerNamesKey}' checkbox`);
  };

  const onShowUserLocationCheckboxChange = () => {
    dispatch(toggleDisplayUserLocation());

    mapInteractionTracker.track(`${showUserLocation? 'Uncheck' : 'Check'} 'Show My Current Location' checkbox`);
  };

  useEffect(() => {
    if (markerNamesAllChekboxRef.current) {
      markerNamesAllChekboxRef.current.indeterminate = isMarkerNamesPartiallyChecked;
    }
  }, [isMarkerNamesPartiallyChecked]);

  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      <fieldset>
        <legend className={styles.subTitle}>{t('markerNamesLegend')}</legend>

        <div className={styles.checkboxWrapper}>
          <input
            aria-checked={isMarkerNamesPartiallyChecked ? 'mixed' : undefined}
            checked={isMarkerNamesFullyChecked}
            className={styles.checkbox}
            id="map-markers-names-all-checkbox"
            onChange={onMarkerNamesAllCheckboxChange}
            ref={markerNamesAllChekboxRef}
            type="checkbox"
          />

          <label className={styles.label} htmlFor="map-markers-names-all-checkbox">
            {t('markerNamesAllCheckboxLabel')}
          </label>
        </div>

        {Object.keys(showMapNames).map((markerNamesKey) => <div
          className={`${styles.checkboxWrapper} ${styles.indent}`}
          key={markerNamesKey}
        >
          <input
            checked={showMapNames[markerNamesKey].enabled}
            className={styles.checkbox}
            id={`map-markers-names-${markerNamesKey}-checkbox`}
            onChange={onMarkerNamesCheckboxChange(markerNamesKey)}
            type="checkbox"
          />

          <label className={styles.label} htmlFor={`map-markers-names-${markerNamesKey}-checkbox`}>
            {t(`markerNamesCheckboxLabel.${showMapNames[markerNamesKey].key}`)}
          </label>
        </div>)}
      </fieldset>

      {!!hasUserLocation && <>
        <hr className={styles.separator} />

        <div className={styles.checkboxWrapper}>
          <input
            checked={showUserLocation}
            className={styles.checkbox}
            id="map-markers-show-user-location-checkbox"
            onChange={onShowUserLocationCheckboxChange}
            type="checkbox"
          />

          <label className={styles.label} htmlFor="map-markers-show-user-location-checkbox">
            {t('showUserLocationCheckboxLabel')}
          </label>
        </div>
      </>}
    </div>
  </fieldset>;
};

export default MapMarkersFieldSet;
