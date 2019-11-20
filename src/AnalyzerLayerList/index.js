import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkmark from '../Checkmark';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import isEqual from 'react-fast-compare';
import { hideAnalyzers, showAnalyzers } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import CheckableList from '../CheckableList';
import { getAnalyzerListState } from './selectors';
import AnalyzerListItem from './AnalyzerListItem';

import listStyles from '../SideBar/styles.module.scss';

// eslint-disable-next-line react/display-name
const AnalyzerLayerList = memo((props) => {
  const { analyzerList, hiddenAnalyzerIDs, hideAnalyzers, showAnalyzers, map } = props;

  const analyzers = analyzerList[0].features;
  const analyzerFeatureIds = analyzers.map((analyzer) => {
    const { properties: { id } } = analyzer.features[0];
    return id;
  });

  const hideAllAnalyzers = () => hideAnalyzers(...analyzerFeatureIds);
  const showAllAnalyzers = () => showAnalyzers(...analyzerFeatureIds);

  const onToggleAllFeatures = (e) => {
    e.stopPropagation();

    if (allVisible) {
      trackEvent('Map Layers', 'Uncheck All Features checkbox');
      return hideAllAnalyzers();
    } else {
      trackEvent('Map Layers', 'Check All Features checkbox');
      return showAllAnalyzers();
    }
  };

  const featureIsVisible = item => {
    const { properties: { id } } = item.features[0];
    return !hiddenAnalyzerIDs.includes(id);
  };

  const partiallyChecked = (hiddenAnalyzerIDs.length <= analyzerList.length);
  const allVisible = !hiddenAnalyzerIDs.length || !intersection(hiddenAnalyzerIDs, analyzerFeatureIds);

  const collapsibleShouldBeOpen = false;

  const onAnalyzerClick = (item) => {
    const { properties: { id } } = item.features[0];
    if (featureIsVisible(item)) {
      trackEvent('Map Layer', 'Uncheck Analyzer checkbox');
      return hideAnalyzers(id);
    } else {
      trackEvent('Map Layer', 'Check Analyzer checkbox');
      return showAnalyzers(id);
    }
  };

  const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
    lazyRender: true,
    transitionTime: 1,
  };

  const itemProps = { map };

  const trigger = <span>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={partiallyChecked} />
    <h5 className={listStyles.trigger}>Analyzers</h5>
  </span>;

  return <ul className={listStyles.list}>
    <li><Collapsible
      className={listStyles.collapsed}
      openedClassName={listStyles.opened}
      {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
      trigger={trigger}
      open={collapsibleShouldBeOpen}>
      <CheckableList
        className={`${listStyles.list} ${listStyles.itemList} ${listStyles.compressed}`}
        id='analyzergroup'
        onCheckClick={onAnalyzerClick}
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
  analyzerFeatures: state.data.analyzerFeatures,
  hiddenAnalyzerIDs: state.view.hiddenAnalyzerIDs,
  analyzerList: getAnalyzerListState(state),
  mapLayerFilter: state.data.mapLayerFilter
});

export default connect(mapStateToProps, { hideAnalyzers, showAnalyzers })(AnalyzerLayerList);

AnalyzerLayerList.defaultProps = {
  map: {},
};

AnalyzerLayerList.propTypes = {
  map: PropTypes.object,
};