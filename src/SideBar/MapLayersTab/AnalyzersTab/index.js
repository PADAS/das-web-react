import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import intersection from 'lodash/intersection';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { analyzersHaveFailures } from '../../../selectors';
import { fetchAnalyzers } from '../../../ducks/analyzers';
import { getAnalyzerListState } from './selectors';
import { hideAnalyzers, showAnalyzers } from '../../../ducks/map-layer-filter';
import { MapContext } from '../../../MapContext';
import { setAnalyzerFeatureActiveStateForIDs } from '../../../utils/analyzers';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../../../utils/analytics';

import AnalyzerListItem from './AnalyzerListItem';
import CheckableList from '../../../CheckableList';
import Checkmark from '../../../Checkmark';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const AnalyzersTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

  const analyzerList = useSelector(getAnalyzerListState);
  const haveAnalyzersFailed = useSelector(analyzersHaveFailures);
  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const map = useContext(MapContext);

  const allAnalyzersChekboxRef = useRef();

  const analyzers = useMemo(() => mapLayerFilter.text
    ? analyzerList[0].features.filter(
      (feature) => feature.name.toLowerCase().includes(mapLayerFilter.text.toLowerCase())
    )
    : analyzerList[0].features, [analyzerList, mapLayerFilter.text]);

  const analyzerIds = useMemo(() => analyzers.map(({ id }) => id), [analyzers]);
  const analyzerFeatureIDs = useMemo(() =>
    analyzers.map((analyzer) =>
      analyzer.features.map((feature) =>
        feature.properties.feature_group)
    ), [analyzers]);

  // XXX flatten the feature array - should be a cleaner way
  const featureIds = analyzerFeatureIDs.flat(2);

  const areAnalyzersPartiallyChecked = (mapLayerFilter.hiddenAnalyzerIDs.length < analyzerIds.length);
  const areAnalyzersFullyChecked = !mapLayerFilter.hiddenAnalyzerIDs.length || !intersection(mapLayerFilter.hiddenAnalyzerIDs, analyzerIds);

  const onToggleAllAnalyzers = (event) => {
    event.stopPropagation();

    if (areAnalyzersFullyChecked) {
      const allAnalyazerFeautureIds = analyzers.reduce((accumulator, analyzer) => {
        return [...accumulator, ...analyzer.features.map(f => f.properties.id)];
      }, []);
      setAnalyzerFeatureActiveStateForIDs(map, allAnalyazerFeautureIds, false);

      dispatch(hideAnalyzers(...analyzerIds));

      mapLayerTracker.track('Uncheck All Analyzers checkbox');
    } else {
      dispatch(showAnalyzers(...analyzerIds));

      mapLayerTracker.track('Check All Analyzers checkbox');
    }
  };

  const featureIsVisible = item => {
    const { id } = item;
    return !mapLayerFilter.hiddenAnalyzerIDs.includes(id);
  };

  const onCheckClick = (item) => {
    const { id } = item;

    if (featureIsVisible(item)) {
      mapLayerTracker.track('Uncheck Analyzer checkbox');
      setAnalyzerFeatureActiveStateForIDs(map, item.features.map(f => f.properties.id), false);
      return dispatch(hideAnalyzers(id));
    } else {
      mapLayerTracker.track('Check Analyzer checkbox');
      return dispatch(showAnalyzers(id));
    }
  };

  const onRetry = useCallback(() => {
    mapLayerTracker.track('Retry loading analyzers');

    dispatch(fetchAnalyzers());
  }, [dispatch]);

  useEffect(() => {
    if (allAnalyzersChekboxRef.current) {
      allAnalyzersChekboxRef.current.indeterminate = areAnalyzersPartiallyChecked;
    }
  }, [areAnalyzersPartiallyChecked]);

  return <>
    <div className={styles.allCheckboxWrapper}>
      <input
        aria-label={t('allAnalyzersCheckboxAriaLabel')}
        aria-checked={areAnalyzersPartiallyChecked ? 'mixed' : undefined}
        checked={areAnalyzersFullyChecked}
        className={styles.checkbox}
        id="all-analyzers-checkbox"
        onChange={onToggleAllAnalyzers}
        ref={allAnalyzersChekboxRef}
        type="checkbox"
      />

      <label className={styles.label} htmlFor="all-analyzers-checkbox">
        <Checkmark fullyChecked={areAnalyzersFullyChecked} partiallyChecked={areAnalyzersPartiallyChecked} />

        {t('allAnalyzersCheckboxLabel')}
      </label>
    </div>

    {haveAnalyzersFailed && <div className={styles.errorBanner} role="alert">
      <p>{analyzers.length ? t('analyzersPartialLoadErrorMessage') : t('analyzersLoadErrorMessage')}</p>

      <Button onClick={onRetry} size="sm" type="button" variant="outline-secondary">
        {t('analyzersRetryButtonLabel')}
      </Button>
    </div>}

    {analyzers.length > 0 && <CheckableList
      className={`${styles.list} ${styles.itemList} ${styles.compressed}`}
      id='analyzergroup'
      onCheckClick={onCheckClick}
      itemComponent={AnalyzerListItem}
      itemProps={{ analyzerIds, featureIds, map }}
      items={analyzers}
      itemFullyChecked={featureIsVisible}
    />}
  </>;
};

export default AnalyzersTab;
