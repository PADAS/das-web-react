import React, { memo, useCallback, useContext, useDeferredValue, useMemo } from 'react';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';

import { getAllFeatureIDsInList, getUniqueIDsFromFeatures, filterFeatures } from '../utils/features';
import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import { LayerFilterContext } from '../MapLayerFilter/context';
import Checkmark from '../Checkmark';
import { getFeatureLayerListState } from './selectors';
import CheckableList from '../CheckableList';
import Content from './Content';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const getFeatureSetFeatureIDs = ({ featuresByType }) => getUniqueIDsFromFeatures(...featuresByType.reduce((result, { features }) => [...result, ...features], []));

const Trigger = ({ onToggleAllFeatures, allVisible, someVisible }) =>  <div>
  <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={someVisible} />
  <h5 className={listStyles.trigger}>Features</h5>
</div>;


// eslint-disable-next-line react/display-name
const FeatureLayerList = ({ featureList, hideFeatures, showFeatures, hiddenFeatureIDs, map }) => {
  const { filterText: filterFromContext } = useContext(LayerFilterContext);

  const filterText = useDeferredValue(filterFromContext);


  const featureFilterEnabled = !!filterText.length;

  const allFeatureIDs = useMemo(() => getAllFeatureIDsInList(featureList), [featureList]);

  const allVisible = !hiddenFeatureIDs.length;

  const allVisibleInSet = useCallback(set =>
    allVisible
      || !intersection(getFeatureSetFeatureIDs(set),
        hiddenFeatureIDs
      ).length
  , [allVisible, hiddenFeatureIDs]);

  const onFeatureSetToggle = useCallback((set) => {
    const featureIDs = getFeatureSetFeatureIDs(set);
    if (allVisibleInSet(set)) {
      mapLayerTracker.track('Uncheck Feature Set checkbox', `Feature Set:${set.name}`);
      return hideFeatures(...featureIDs);
    } else {
      mapLayerTracker.track('Check Feature Set checkbox', `Feature Set:${set.name}`);
      return showFeatures(...featureIDs);
    }
  }, [allVisibleInSet, hideFeatures, showFeatures]);

  const hideAllFeatures = useCallback(() => hideFeatures(...allFeatureIDs), [allFeatureIDs, hideFeatures]);
  const showAllFeatures = useCallback(() => showFeatures(...allFeatureIDs), [allFeatureIDs, showFeatures]);

  const onToggleAllFeatures = useCallback((e) => {
    e.stopPropagation();

    if (allVisible) {
      mapLayerTracker.track('Uncheck All Features checkbox');
      return hideAllFeatures();
    } else {
      mapLayerTracker.track('Check All Features checkbox');
      return showAllFeatures();
    }
  }, [allVisible, hideAllFeatures, showAllFeatures]);

  const featureFilterIsMatch = useCallback((feature) => {
    if (!featureFilterEnabled) return true;
    return (feature.properties.title.toLowerCase().includes(filterText));
  }, [featureFilterEnabled, filterText]);

  const someVisible = !allVisible && hiddenFeatureIDs.length !== allFeatureIDs.length;

  const someVisibleInSet = useCallback(set => {
    const featureIDs = getFeatureSetFeatureIDs(set);
    return intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
  }, [hiddenFeatureIDs]);

  const filteredFeatureList = useMemo(() =>
    featureFilterEnabled ?
      filterFeatures(featureList, featureFilterIsMatch) : featureList
  , [featureFilterEnabled, featureFilterIsMatch, featureList]);

  const itemProps = useMemo(() => ({ map, featureFilterEnabled, }), [featureFilterEnabled, map]);
  if (!featureList.length) return null;
  if (featureFilterEnabled && !filteredFeatureList.length) return null;

  const collapsibleShouldBeOpen = featureFilterEnabled && !!filteredFeatureList.length;

  return <ul className={listStyles.list}>
    <li>
      <Collapsible
        className={listStyles.collapsed}
        openedClassName={listStyles.opened}
        {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
        trigger={<Trigger onToggleAllFeatures={onToggleAllFeatures} allVisible={allVisible} someVisible={someVisible} />}
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
});

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(FeatureLayerList));
