import React, { useContext, useEffect, useMemo, useRef } from 'react';
import intersection from 'lodash/intersection';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { filterFeatures, getUniqueIDsFromFeatures } from '../../../utils/features';
import { getFeatureLayerListState } from './selectors';
import { hideFeatures, showFeatures } from '../../../ducks/map-layer-filter';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { MapContext } from '../../../MapContext';

import CheckableList from '../../../CheckableList';
import Checkmark from '../../../Checkmark';
import Content from './Content';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const FeaturesTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

  const featureLayerList = useSelector(getFeatureLayerListState);
  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const map = useContext(MapContext);

  const allFeaturesChekboxRef = useRef();

  const featureFilterEnabled = mapLayerFilter.text.length > 0;

  const allFeatureIDs = useMemo(() => {
    return featureLayerList.reduce((accumulator, item, _idx) => {
      const featuresInClass = item.featuresByType.map(({ features }) =>
        features.map(({ id }) =>
          id)
      );

      return [accumulator, featuresInClass].flat(2);
    }, []);
  }, [featureLayerList]);

  const areFeaturesFullyChecked = !mapLayerFilter.hiddenFeatureIDs.length;
  const areFeaturesPartiallyChecked = !areFeaturesFullyChecked && mapLayerFilter.hiddenFeatureIDs.length !== allFeatureIDs.length;

  const getFeatureSetFeatureIDs = ({ featuresByType }) => getUniqueIDsFromFeatures(
    ...featuresByType.reduce((result, { features }) => [...result, ...features], [])
  );

  const allVisibleInSet = (set) => areFeaturesFullyChecked || !intersection(getFeatureSetFeatureIDs(set), mapLayerFilter.hiddenFeatureIDs).length;

  const someVisibleInSet = (set) => {
    const featureIDs = getFeatureSetFeatureIDs(set);
    return intersection(featureIDs, mapLayerFilter.hiddenFeatureIDs).length !== featureIDs.length;
  };

  const onFeatureSetToggle = (set) => {
    const featureIDs = getFeatureSetFeatureIDs(set);

    if (allVisibleInSet(set)) {
      mapLayerTracker.track('Uncheck Feature Set checkbox', `Feature Set:${set.name}`);
      return dispatch(hideFeatures(...featureIDs));
    } else {
      mapLayerTracker.track('Check Feature Set checkbox', `Feature Set:${set.name}`);
      return dispatch(showFeatures(...featureIDs));
    }
  };

  const onToggleAllFeatures = (event) => {
    event.stopPropagation();

    if (areFeaturesFullyChecked) {
      dispatch(hideFeatures(...allFeatureIDs));

      mapLayerTracker.track('Uncheck All Features checkbox');
    } else {
      dispatch(showFeatures(...allFeatureIDs));

      mapLayerTracker.track('Check All Features checkbox');
    }
  };

  const featureFilterIsMatch = (feature) => mapLayerFilter.text.length === 0
    || feature.name.toLowerCase().includes(mapLayerFilter.text.toLowerCase());

  const filteredFeatureList = featureFilterEnabled ?
    filterFeatures(featureLayerList, featureFilterIsMatch) : featureLayerList;

  useEffect(() => {
    if (allFeaturesChekboxRef.current) {
      allFeaturesChekboxRef.current.indeterminate = areFeaturesPartiallyChecked;
    }
  }, [areFeaturesPartiallyChecked]);

  return <>
    <div className={styles.allCheckboxWrapper}>
      <input
        aria-label={t('allFeaturesCheckboxAriaLabel')}
        aria-checked={areFeaturesPartiallyChecked ? 'mixed' : undefined}
        checked={areFeaturesFullyChecked}
        className={styles.checkbox}
        id="all-features-checkbox"
        onChange={onToggleAllFeatures}
        ref={allFeaturesChekboxRef}
        type="checkbox"
      />

      <label className={styles.label} htmlFor="all-features-checkbox">
        <Checkmark fullyChecked={areFeaturesFullyChecked} partiallyChecked={areFeaturesPartiallyChecked} />

        {t('allFeaturesCheckboxLabel')}
      </label>
    </div>

    {filteredFeatureList.length > 0 && <CheckableList
      className={styles.list}
      itemComponent={Content}
      itemFullyChecked={allVisibleInSet}
      itemPartiallyChecked={someVisibleInSet}
      itemProps={{ featureFilterEnabled, map }}
      items={filteredFeatureList}
      onCheckClick={onFeatureSetToggle}
    />}
  </>;
};

export default FeaturesTab;
