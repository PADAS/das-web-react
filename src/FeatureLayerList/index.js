import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';

import { getUniqueIDsFromFeatures, filterFeatures } from '../utils/features';
import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';

import Checkmark from '../Checkmark';
import { getFeatureLayerListState } from './selectors';
import { getAnalyzerListState } from './selectors';
import CheckableList from '../CheckableList';
import Content from './Content';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

// eslint-disable-next-line react/display-name
const FeatureLayerList = ({ featureList, analyzerList, hideFeatures, showFeatures, hiddenFeatureIDs, map, mapLayerFilter }) => {

  const getAllFeatureIDsInList = () => getUniqueIDsFromFeatures(...featureList
    .reduce((accumulator, { featuresByType }) =>
      [...accumulator,
      ...featuresByType.reduce((result, { features }) => [...result, ...features], [])
      ], [])
  );

  const [searchText, setSearchTextState] = useState('');
  const [featureFilterEnabled, setFeatureFilterEnabledState] = useState(false);

  const allFeatureIDs = getAllFeatureIDsInList();

  const hideAllFeatures = () => hideFeatures(...allFeatureIDs);
  const showAllFeatures = () => showFeatures(...allFeatureIDs);

  const allVisible = !hiddenFeatureIDs.length;
  const someVisible = !allVisible && hiddenFeatureIDs.length !== allFeatureIDs.length;

  const getFeatureSetFeatureIDs = ({ featuresByType }) => getUniqueIDsFromFeatures(...featuresByType.reduce((result, { features }) => [...result, ...features], []));

  const allVisibleInSet = set => allVisible || !intersection(getFeatureSetFeatureIDs(set), hiddenFeatureIDs).length;

  const someVisibleInSet = set => {
    const featureIDs = getFeatureSetFeatureIDs(set);
    return intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
  };

  const onFeatureSetToggle = (set) => {
    const featureIDs = getFeatureSetFeatureIDs(set);
    if (allVisibleInSet(set)) {
      trackEvent('Map Layers', 'Uncheck Feature Set checkbox', `Feature Set:${set.name}`);
      return hideFeatures(...featureIDs);
    } else {
      trackEvent('Map Layers', 'Check Feature Set checkbox', `Feature Set:${set.name}`);
      return showFeatures(...featureIDs);
    }
  };

  const onToggleAllFeatures = (e) => {
    e.stopPropagation();

    if (allVisible) {
      trackEvent('Map Layers', 'Uncheck All Features checkbox');
      return hideAllFeatures();
    } else {
      trackEvent('Map Layers', 'Check All Features checkbox');
      return showAllFeatures();
    }
  };

  const featureFilterIsMatch = (feature) => {
    if (searchText.length === 0) return true;
    return (feature.properties.title.toLowerCase().includes(searchText));
  };

  useEffect(() => {
    const filterText = mapLayerFilter.filter.text || '';
    setSearchTextState(filterText);
    setFeatureFilterEnabledState(filterText.length > 0);
  }, [mapLayerFilter]);

  const filteredFeatureList = featureFilterEnabled ?
    filterFeatures(featureList, featureFilterIsMatch) : featureList;

  const collapsibleShouldBeOpen = featureFilterEnabled && !!filteredFeatureList.length;
  if (featureFilterEnabled && !filteredFeatureList.length) return null;

  const itemProps = { map, featureFilterEnabled, };

  const trigger = <div>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={someVisible} />
    <h5 className={listStyles.trigger}>Features</h5>
  </div>;

  return <ul className={listStyles.list}>
    <li>
      <Collapsible
        className={listStyles.collapsed}
        openedClassName={listStyles.opened}
        {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
        trigger={trigger}
        open={collapsibleShouldBeOpen}>
        <CheckableList
          className={listStyles.list}
          items={filteredFeatureList}
          itemProps={itemProps}
          itemFullyChecked={allVisibleInSet}
          itemPartiallyChecked={someVisibleInSet}
          onCheckClick={onFeatureSetToggle}
          itemComponent={Content}
        />
      </Collapsible>
    </li>
  </ul>;
};

const mapStateToProps = (state) => ({
  featureList: getFeatureLayerListState(state),
  hiddenFeatureIDs: state.view.hiddenFeatureIDs,
  analyzerList: getAnalyzerListState(state),
  mapLayerFilter: state.data.mapLayerFilter
});

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(FeatureLayerList));
