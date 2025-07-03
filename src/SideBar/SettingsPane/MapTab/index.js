import React, { useEffect, useRef }  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import {
  setMapClusterData,
  setShowMapClusterPolygons,
  toggleShowInactiveRadioState,
  toggleTrackTimepointState,
} from '../../../ducks/map-ui';

import Map3DToggleControl from '../../../MapSettingsControl/Map3DToggleControl';
import MapDataZoomSimplificationControl from '../../../MapDataZoomSimplificationControl';
import MapLockControl from '../../../MapLockControl';
import MapNamesControl from '../../../MapNamesControl';
import UserLocationMapControl from '../../../UserLocationMapControl';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.mapTab' });

  const hasUserLocation = useSelector((state) => !!state.view.userLocation);
  const isTimeSliderActive = useSelector((state) => !!state.view.timeSliderState.active);
  const mapClusterConfig = useSelector((state) => state.view.mapClusterConfig);
  const showInactiveRadios = useSelector((state) => state.view.showInactiveRadios);
  const showTrackTimepoints = useSelector((state) => state.view.showTrackTimepoints);

  const clusterDataAllChekboxRef = useRef();

  const isClusterDataFullyChecked = mapClusterConfig.data.events && mapClusterConfig.data.subjects;
  const isClusterDataPartiallyChecked = !isClusterDataFullyChecked
    && (mapClusterConfig.data.events || mapClusterConfig.data.subjects);

  const onShowTrackTimepointsCheckboxChange = () => {
    dispatch(toggleTrackTimepointState());

    mapInteractionTracker.track(`${showTrackTimepoints? 'Uncheck' : 'Check'} 'Show Track Timepoints' checkbox`);
  };

  const onShowInactiveRadiosCheckboxChange = () => {
    dispatch(toggleShowInactiveRadioState(!showInactiveRadios));

    mapInteractionTracker.track(`${showInactiveRadios? 'Uncheck' : 'Check'} 'Show Inactive Radios' checkbox`);
  };

  useEffect(() => {
    if (clusterDataAllChekboxRef.current) {
      clusterDataAllChekboxRef.current.indeterminate = isClusterDataPartiallyChecked;
    }
  }, [isClusterDataPartiallyChecked]);

  return <>
    <section>
      <h3>{t('generalHeader')}</h3>

      <ul>
        <li><MapLockControl /></li>

        <li><Map3DToggleControl /></li>

        <li><MapDataZoomSimplificationControl /></li>
      </ul>
    </section>

    <hr className={styles.separator} />

    <fieldset className={styles.section}>
      <legend className={styles.title}>{t('displayLegend')}</legend>

      <div className={styles.checkboxWrapper}>
        <input
          checked={showTrackTimepoints}
          className={styles.checkbox}
          id="show-track-timepoints"
          onChange={onShowTrackTimepointsCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="show-track-timepoints">
          {t('showTrackTimepointsCheckboxLabel')}
        </label>
      </div>

      <div className={styles.checkboxWrapper}>
        <input
          checked={showInactiveRadios}
          className={styles.checkbox}
          id="show-inactive-radios"
          onChange={onShowInactiveRadiosCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="show-inactive-radios">
          {t('showInactiveRadiosCheckboxLabel')}
        </label>
      </div>

      <div className={styles.checkboxWrapper}>
        <input
          checked={mapClusterConfig.showPolygons}
          className={styles.checkbox}
          disabled={!isClusterDataFullyChecked && !isClusterDataPartiallyChecked}
          id="show-cluster-polygons"
          onChange={(event) => dispatch(setShowMapClusterPolygons(event.target.checked))}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="show-cluster-polygons">
          {t('showClusterPolygonsCheckboxLabel')}
        </label>
      </div>

      <fieldset>
        <legend className={styles.subTitle}>{t('clusterDataLegend')}</legend>

        <div className={styles.checkboxWrapper}>
          <input
            aria-checked={isClusterDataFullyChecked ? true : isClusterDataPartiallyChecked ? 'mixed' : false}
            checked={isClusterDataFullyChecked}
            className={styles.checkbox}
            disabled={isTimeSliderActive}
            id="cluster-data-all"
            onChange={() => dispatch(setMapClusterData({
              events: !isClusterDataFullyChecked,
              subjects: !isClusterDataFullyChecked,
            }))}
            ref={clusterDataAllChekboxRef}
            type="checkbox"
          />

          <label className={styles.label} htmlFor="cluster-data-all">
            {t('clusterDataAllCheckboxLabel')}
          </label>
        </div>

        <div className={`${styles.checkboxWrapper} ${styles.indent}`}>
          <input
            checked={mapClusterConfig.data.events}
            className={styles.checkbox}
            disabled={isTimeSliderActive}
            id="cluster-data-events"
            onChange={(event) => dispatch(setMapClusterData({
              ...mapClusterConfig.data,
              events: event.target.checked,
            }))}
            type="checkbox"
          />

          <label className={styles.label} htmlFor="cluster-data-events">
            {t('clusterDataEventsCheckboxLabel')}
          </label>
        </div>

        <div className={`${styles.checkboxWrapper} ${styles.indent}`}>
          <input
            checked={mapClusterConfig.data.subjects}
            className={styles.checkbox}
            disabled={isTimeSliderActive}
            id="cluster-data-subjects"
            onChange={(event) => dispatch(setMapClusterData({
              ...mapClusterConfig.data,
              subjects: event.target.checked,
            }))}
            type="checkbox"
          />

          <label className={styles.label} htmlFor="cluster-data-subjects">
            {t('clusterDataSubjectsCheckboxLabel')}
          </label>
        </div>
      </fieldset>
    </fieldset>

    <hr className={styles.separator} />

    <section>
      <h3>{t('mapMarkersHeader')}</h3>

      <h6>{t('mapMarkersDescription')}</h6>

      <ul>
        <li><MapNamesControl /></li>
      </ul>
    </section>

    <ul>
      {!!hasUserLocation && <li><UserLocationMapControl /></li>}
    </ul>

    <hr className={styles.separator} />
  </>;
};

export default MapTab;
