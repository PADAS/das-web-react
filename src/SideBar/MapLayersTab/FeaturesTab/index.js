import React, { useContext, useEffect, useState } from 'react';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getFeatureLayerListState } from './selectors';
import { getUniqueIDsFromFeatures, filterFeatures } from '../../../utils/features';
import { hideFeatures, showFeatures } from '../../../ducks/map-layer-filter';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { MapContext } from '../../../App';

import CheckableList from '../../../CheckableList';
import Checkmark from '../../../Checkmark';
import Content from './Content';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const FeaturesTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

  const featureList = useSelector(getFeatureLayerListState);
  const hiddenFeatureIDs = useSelector((state) => state.data.mapLayerFilter.hiddenFeatureIDs);
  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const map = useContext(MapContext);

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

  const allFeatureIDs = getAllFeatureIDsInList();

  const hideAllFeatures = () => dispatch(hideFeatures(...allFeatureIDs));
  const showAllFeatures = () => dispatch(showFeatures(...allFeatureIDs));

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
      return dispatch(hideFeatures(...featureIDs));
    } else {
      mapLayerTracker.track('Check Feature Set checkbox', `Feature Set:${set.name}`);
      return dispatch(showFeatures(...featureIDs));
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

  const itemProps = { map, featureFilterEnabled, };

  const trigger = <div>
    <Checkmark onClick={onToggleAllFeatures} fullyChecked={allVisible} partiallyChecked={someVisible} />
    <h5 className={styles.trigger}>
      {t('featuresTitle')}
    </h5>
  </div>;

  return filteredFeatureList.length > 0 ? <ul className={styles.list}>
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
          className={styles.list}
          items={filteredFeatureList}
          itemProps={itemProps}
          itemFullyChecked={allVisibleInSet}
          itemPartiallyChecked={someVisibleInSet}
          onCheckClick={onFeatureSetToggle}
          itemComponent={Content}
        />
      </Collapsible>
    </li>
  </ul> : null;
};

export default FeaturesTab;
