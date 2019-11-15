import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkmark from '../Checkmark';
import Collapsible from 'react-collapsible';
import debounceRender from 'react-debounce-render';
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
  const { analyzerList, hiddenAnalyzerIDs, map } = props;

  const analyzers = analyzerList[0].features;

  const someAnalyzersVisible = set => {
    // const featureIDs = getFeatureSetFeatureIDs(set);
    // return intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
    return true;
  };

  const allVisible = () => true;

  const partiallyChecked = () => { //TODO
    //const analyzerIDs = getUniqueAnalyzerIDs(group);
    return true;
  };

  const collapsibleShouldBeOpen = false; //!!analyzers.length;

  const onToggleAllFeatures = () => {
    console.log('toggleAllFeatures clicked');
  };

  const featureIsVisible = item => !hiddenAnalyzerIDs.includes(item.properties.id);

  const onAnalyzerClick = (item) => {
    console.log('analyzer', item)
    const { properties: { id } } = item.features[0];
    if (featureIsVisible(item.features[0])) {
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

  return /*!!filteredAnalyzerGroups.length &&*/ <Collapsible
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={trigger}
    open={collapsibleShouldBeOpen}>
    <CheckableList
      className={listStyles.list}
      id='analyzergroup'
      onCheckClick={onAnalyzerClick}
      itemComponent={AnalyzerListItem}
      itemProps={itemProps}
      items={analyzers}
      itemFullyChecked={allVisible}
      itemPartiallyChecked={someAnalyzersVisible} />
  </Collapsible>
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