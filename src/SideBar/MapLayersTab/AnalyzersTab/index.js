import React, { useCallback, useContext, useMemo } from 'react';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getAnalyzerListState } from './selectors';
import { hideAnalyzers, showAnalyzers } from '../../../ducks/map-layer-filter';
import { MapContext } from '../../../App';
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
  const hiddenAnalyzerIDs = useSelector((state) => state.data.mapLayerFilter.hiddenAnalyzerIDs);
  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const map = useContext(MapContext);

  const analyzers = useMemo(() => {
    const { text } = mapLayerFilter;

    if (!text) return analyzerList[0].features;

    return analyzerList[0].features.filter(({ name }) => name.toLowerCase().includes(text.toLowerCase()));

  }, [analyzerList, mapLayerFilter]);

  const analyzerIds = useMemo(() => analyzers.map(({ id }) => id), [analyzers]);
  const analyzerFeatureIDs = useMemo(() =>
    analyzers.map((analyzer) =>
      analyzer.features.map((feature) =>
        feature.properties.feature_group)
    ), [analyzers]);

  // XXX flatten the feature array - should be a cleaner way
  const featureIds = analyzerFeatureIDs.flat(2);

  const hideAllAnalyzers = useCallback(() => dispatch(hideAnalyzers(...analyzerIds)), [analyzerIds, dispatch]);
  const showAllAnalyzers = useCallback(() => dispatch(showAnalyzers(...analyzerIds)), [analyzerIds, dispatch]);

  const partiallyChecked = (hiddenAnalyzerIDs.length < analyzerIds.length);
  const allVisible = !hiddenAnalyzerIDs.length || !intersection(hiddenAnalyzerIDs, analyzerIds);

  const collapsibleShouldBeOpen = useMemo(() => {
    const { text } = mapLayerFilter;

    if (!text) return false;

    return !!analyzers.length;
  }, [analyzers.length, mapLayerFilter]);


  const onToggleAllFeatures = useCallback((e) => {
    e.stopPropagation();

    if (allVisible) {
      const allFeatureIds = analyzers.reduce((accumulator, analyzer) => {
        return [...accumulator, ...analyzer.features.map(f => f.properties.id)];
      }, []);

      mapLayerTracker.track('Uncheck All Features checkbox');
      setAnalyzerFeatureActiveStateForIDs(map, allFeatureIds, false);

      return hideAllAnalyzers();
    } else {
      mapLayerTracker.track('Check All Features checkbox');

      return showAllAnalyzers();
    }
  }, [allVisible, analyzers, hideAllAnalyzers, map, showAllAnalyzers]);

  const featureIsVisible = useCallback(item => {
    const { id } = item;
    return !hiddenAnalyzerIDs.includes(id);
  }, [hiddenAnalyzerIDs]);


  const onCheckClick = useCallback((item) => {
    const { id } = item;

    if (featureIsVisible(item)) {
      mapLayerTracker.track('Uncheck Analyzer checkbox');
      setAnalyzerFeatureActiveStateForIDs(map, item.features.map(f => f.properties.id), false);
      return dispatch(hideAnalyzers(id));
    } else {
      mapLayerTracker.track('Check Analyzer checkbox');
      return dispatch(showAnalyzers(id));
    }
  }, [dispatch, featureIsVisible, map]);

  const itemProps = { map, analyzerIds, featureIds };

  const trigger = <span>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={partiallyChecked} />
    <h5 className={styles.trigger}>
      {t('analyzersTitle')}
    </h5>
  </span>;

  return analyzers.length > 0 ? <ul className={styles.list}>
    <li>
      <Collapsible
        transitionTime={1}
        trigger={trigger}
        triggerElementProps={{
          label: t(collapsibleShouldBeOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel'),
          title: t(collapsibleShouldBeOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle'),
        }}
        open={collapsibleShouldBeOpen}
      >
        <CheckableList
          className={`${styles.list} ${styles.itemList} ${styles.compressed}`}
          id='analyzergroup'
          onCheckClick={onCheckClick}
          itemComponent={AnalyzerListItem}
          itemProps={itemProps}
          items={analyzers}
          itemFullyChecked={featureIsVisible}
        />
      </Collapsible>
    </li>
  </ul> : null;
};

export default AnalyzersTab;
