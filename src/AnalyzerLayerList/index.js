import React, { memo, useCallback, useContext, useDeferredValue, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkmark from '../Checkmark';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import isEqual from 'react-fast-compare';
import { hideAnalyzers, showAnalyzers } from '../ducks/map-ui';
import { LayerFilterContext } from '../MapLayerFilter/context';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { setAnalyzerFeatureActiveStateForIDs } from '../utils/analyzers';
import CheckableList from '../CheckableList';
import { getAnalyzerListState } from './selectors';
import { analyzerFeatures } from '../selectors';
import AnalyzerListItem from './AnalyzerListItem';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

// eslint-disable-next-line react/display-name
const AnalyzerLayerList = memo((props) => {
  const { analyzerList, hiddenAnalyzerIDs, hideAnalyzers, showAnalyzers, map } = props;

  const { filterText: filterFromContext } = useContext(LayerFilterContext);

  const filterText = useDeferredValue(filterFromContext);

  const analyzers = useMemo(() => {
    if (!filterText) return analyzerList[0].features;

    return analyzerList[0].features.filter(({ name }) => name.toLowerCase().includes(filterText.toLowerCase()));

  }, [analyzerList, filterText]);

  const analyzerIds = useMemo(() => analyzers.map(({ id }) => id), [analyzers]);
  const analyzerFeatureIDs = useMemo(() =>
    analyzers.map((analyzer) =>
      analyzer.features.map((feature) =>
        feature.properties.feature_group)
    ), [analyzers]);

  // XXX flatten the feature array - should be a cleaner way
  const featureIds = analyzerFeatureIDs.flat(2);

  const hideAllAnalyzers = useCallback(() => hideAnalyzers(...analyzerIds), [analyzerIds, hideAnalyzers]);
  const showAllAnalyzers = useCallback(() => showAnalyzers(...analyzerIds), [analyzerIds, showAnalyzers]);

  const partiallyChecked = (hiddenAnalyzerIDs.length < analyzerIds.length);
  const allVisible = !hiddenAnalyzerIDs.length || !intersection(hiddenAnalyzerIDs, analyzerIds);

  const collapsibleShouldBeOpen = useMemo(() => {
    if (!filterText) return false;

    return !!analyzers.length;
  }, [analyzers.length, filterText]);


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
      return hideAnalyzers(id);
    } else {
      mapLayerTracker.track('Check Analyzer checkbox');
      return showAnalyzers(id);
    }
  }, [featureIsVisible, hideAnalyzers, map, showAnalyzers]);

  const itemProps = { map, analyzerIds, featureIds };

  const trigger = <span>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={partiallyChecked} />
    <h5 className={listStyles.trigger}>Analyzers</h5>
  </span>;

  return !!analyzers.length && <ul className={listStyles.list}>
    <li><Collapsible
      className={listStyles.collapsed}
      openedClassName={listStyles.opened}
      {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
      trigger={trigger}
      open={collapsibleShouldBeOpen}>
      <CheckableList
        className={`${listStyles.list} ${listStyles.itemList} ${listStyles.compressed}`}
        id='analyzergroup'
        onCheckClick={onCheckClick}
        itemComponent={AnalyzerListItem}
        itemProps={itemProps}
        items={analyzers}
        itemFullyChecked={featureIsVisible} />
    </Collapsible>
    </li>
  </ul>;
}, (prev, current) =>
  isEqual(prev.map && current.map) && isEqual(prev.analyzers, current.analyzers)
);

const mapStateToProps = (state) => ({
  analyzerFeatures: analyzerFeatures(state),
  hiddenAnalyzerIDs: state.view.hiddenAnalyzerIDs,
  analyzerList: getAnalyzerListState(state),
});

export default connect(mapStateToProps, { hideAnalyzers, showAnalyzers })(AnalyzerLayerList);

AnalyzerLayerList.defaultProps = {
  map: {},
};

AnalyzerLayerList.propTypes = {
  map: PropTypes.object,
};
