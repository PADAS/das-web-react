import React, { useEffect, useRef }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../../../../utils/analytics';
import {
  setMapClusterData,
  setShowMapClusterPolygons,
  toggleShowInactiveRadioState,
  toggleTrackTimepointState,
} from '../../../../../ducks/map-ui';

import * as styles from '../../../styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const DisplayFieldSet = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.mainMapSettingsView.displayFieldSet',
  });

  const isTimeSliderActive = useSelector((state) => !!state.view.timeSliderState.active);
  const mapClusterConfig = useSelector((state) => state.view.mapClusterConfig);
  const showInactiveRadios = useSelector((state) => state.view.showInactiveRadios);
  const showTrackTimepoints = useSelector((state) => state.view.showTrackTimepoints);

  const clusterDataAllChekboxRef = useRef();

  const isClusterDataFullyChecked = Object.values(mapClusterConfig.data).every((mapClusterData) => mapClusterData);
  const isClusterDataPartiallyChecked = !isClusterDataFullyChecked
    && Object.values(mapClusterConfig.data).some((mapClusterData) => mapClusterData);

  const onShowTrackTimepointsCheckboxChange = () => {
    dispatch(toggleTrackTimepointState());

    mapInteractionTracker.track(`${showTrackTimepoints? 'Uncheck' : 'Check'} 'Show Track Timepoints' checkbox`);
  };

  const onShowInactiveRadiosCheckboxChange = () => {
    dispatch(toggleShowInactiveRadioState());

    mapInteractionTracker.track(`${showInactiveRadios? 'Uncheck' : 'Check'} 'Show Inactive Radios' checkbox`);
  };

  const onShowClusterPolygonsCheckboxChange = (event) => {
    dispatch(setShowMapClusterPolygons(event.target.checked));

    mapInteractionTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Show cluster polygons' checkbox`);
  };

  const onClusterDataAllCheckboxChange = () => {
    dispatch(setMapClusterData({
      events: !isClusterDataFullyChecked,
      subjects: !isClusterDataFullyChecked,
    }));

    mapInteractionTracker.track(`${isClusterDataFullyChecked ? 'Uncheck' : 'Check'} 'Cluster data: All' checkbox`);
  };

  const onClusterDataCheckboxChange = (mapClusterDataKey) => (event) => {
    dispatch(setMapClusterData({
      ...mapClusterConfig.data,
      [mapClusterDataKey]: event.target.checked,
    }));

    mapInteractionTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Cluster data: ${mapClusterDataKey}' checkbox`);
  };

  useEffect(() => {
    if (clusterDataAllChekboxRef.current) {
      clusterDataAllChekboxRef.current.indeterminate = isClusterDataPartiallyChecked;
    }
  }, [isClusterDataPartiallyChecked]);

  return <fieldset className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      <div className={styles.checkboxWrapper}>
        <input
          checked={showTrackTimepoints}
          className={styles.checkbox}
          id="map-display-show-track-timepoints-checkbox"
          onChange={onShowTrackTimepointsCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="map-display-show-track-timepoints-checkbox">
          {t('showTrackTimepointsCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={showInactiveRadios}
          className={styles.checkbox}
          id="map-display-show-inactive-radios-checkbox"
          onChange={onShowInactiveRadiosCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="map-display-show-inactive-radios-checkbox">
          {t('showInactiveRadiosCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={mapClusterConfig.showPolygons}
          className={styles.checkbox}
          disabled={!isClusterDataFullyChecked && !isClusterDataPartiallyChecked}
          id="map-display-show-cluster-polygons-checkbox"
          onChange={onShowClusterPolygonsCheckboxChange}
          type="checkbox"
        />

        <label
          className={`${styles.label} ${!isClusterDataFullyChecked && !isClusterDataPartiallyChecked ? styles.disabled : ''}`}
          htmlFor="map-display-show-cluster-polygons-checkbox"
        >
          {t('showClusterPolygonsCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <fieldset>
        <legend className={styles.subTitle}>{t('clusterDataLegend')}</legend>

        <div className={styles.checkboxWrapper}>
          <input
            aria-checked={isClusterDataPartiallyChecked ? 'mixed' : undefined}
            checked={isClusterDataFullyChecked}
            className={styles.checkbox}
            disabled={isTimeSliderActive}
            id="map-display-cluster-data-all-checkbox"
            onChange={onClusterDataAllCheckboxChange}
            ref={clusterDataAllChekboxRef}
            type="checkbox"
          />

          <label
            className={`${styles.label} ${isTimeSliderActive ? styles.disabled : ''}`}
            htmlFor="map-display-cluster-data-all-checkbox"
          >
            {t('clusterDataAllCheckboxLabel')}
          </label>
        </div>

        {Object.keys(mapClusterConfig.data).map((mapClusterDataKey) => <div
          className={`${styles.checkboxWrapper} ${styles.indent}`}
          key={mapClusterDataKey}
        >
          <input
            checked={mapClusterConfig.data[mapClusterDataKey]}
            className={styles.checkbox}
            disabled={isTimeSliderActive}
            id={`map-display-cluster-data-${mapClusterDataKey}-checkbox`}
            onChange={onClusterDataCheckboxChange(mapClusterDataKey)}
            type="checkbox"
          />

          <label
            className={`${styles.label} ${isTimeSliderActive ? styles.disabled : ''}`}
            htmlFor={`map-display-cluster-data-${mapClusterDataKey}-checkbox`}
          >
            {t(`clusterDataCheckboxLabel.${mapClusterDataKey}`)}
          </label>
        </div>)}
      </fieldset>
    </div>
  </fieldset>;
};

export default DisplayFieldSet;
