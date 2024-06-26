import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';

import { getUniqueIDsFromFeatures, filterFeatures } from '../utils/features';
import { hideFeatures, showFeatures } from '../ducks/map-layer-filter';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

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

// eslint-disable-next-line react/display-name
const FeatureLayerList = ({
  featureList,
  hideFeatures,
  showFeatures,
  hiddenFeatureIDs,
  map,
  mapLayerFilter
}) => {
  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

  const getAllFeatureIDsInList = () => getUniqueIDsFromFeatures(...featureList
    .reduce((accumulator, { featuresByType }) =>
      [...accumulator,
        ...featuresByType.reduce((result, { features }) => [...result, ...features], [])
      ], [])
  );

  const [searchText, setSearchTextState] = useState('');
  const [featureFilterEnabled, setFeatureFilterEnabledState] = useState(false);

  useEffect(() => {
    const filterText = mapLayerFilter.text || '';
    setSearchTextState(filterText);
    setFeatureFilterEnabledState(filterText.length > 0);
  }, [mapLayerFilter]);

  if (!featureList.length) return null;

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
      mapLayerTracker.track('Uncheck Feature Set checkbox', `Feature Set:${set.name}`);
      return hideFeatures(...featureIDs);
    } else {
      mapLayerTracker.track('Check Feature Set checkbox', `Feature Set:${set.name}`);
      return showFeatures(...featureIDs);
    }
  };

  const onToggleAllFeatures = (e) => {
    e.stopPropagation();

    if (allVisible) {
      mapLayerTracker.track('Uncheck All Features checkbox');
      return hideAllFeatures();
    } else {
      mapLayerTracker.track('Check All Features checkbox');
      return showAllFeatures();
    }
  };

  const featureFilterIsMatch = (feature) => {
    if (searchText.length === 0) return true;
    return (feature.properties.title.toLowerCase().includes(searchText));
  };

  const filteredFeatureList = featureFilterEnabled ?
    filterFeatures(featureList, featureFilterIsMatch) : featureList;

  const collapsibleShouldBeOpen = featureFilterEnabled && !!filteredFeatureList.length;
  if (featureFilterEnabled && !filteredFeatureList.length) return null;

  const itemProps = { map, featureFilterEnabled, };

  const trigger = <div>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={someVisible} />
    <h5 className={listStyles.trigger}>
      {t('featuresTitle')}
    </h5>
  </div>;

  return <ul className={listStyles.list}>
    <li>
      <Collapsible
        className={listStyles.collapsed}
        openedClassName={listStyles.opened}
        {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
        trigger={trigger}
        triggerElementProps={{
          label: t(collapsibleShouldBeOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel'),
          title: t(collapsibleShouldBeOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle'),
        }}
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
  hiddenFeatureIDs: state.data.mapLayerFilter.hiddenFeatureIDs,
  mapLayerFilter: state.data.mapLayerFilter
});

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(FeatureLayerList));
