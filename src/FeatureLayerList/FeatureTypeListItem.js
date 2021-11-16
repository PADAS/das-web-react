import React, { memo } from 'react';

import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';

import { hideFeatures, showFeatures, openMapFeatureType, closeMapFeatureType } from '../ducks/map-ui';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import CheckableList from '../CheckableList';
import FeatureListItem from './FeatureListItem';

import listStyles from '../SideBar/styles.module.scss';
import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const FeatureTypeListItem = (props) => {
  const { name, features, hiddenFeatureIDs, openMapFeatureTypeNames,
    hideFeatures, showFeatures, map, featureFilterEnabled, openMapFeatureType, closeMapFeatureType } = props;

  if (featureFilterEnabled && !features.length) return null;

  const featureIsVisible = item => !hiddenFeatureIDs.includes(item.properties.id);

  const onCheckToggle = (item) => {
    const { properties: { id } } = item;
    if (featureIsVisible(item)) {
      mapLayerTracker.track('Uncheck Feature checkbox');
      return hideFeatures(id);
    } else {
      mapLayerTracker.track('Check Feature checkbox');
      return showFeatures(id);
    }
  };

  const collapsibleShouldBeOpen = (featureFilterEnabled && !!features.length) ||
    openMapFeatureTypeNames.includes(name);

  const onFeatureTypeOpen = () => {
    openMapFeatureType(name);
  };

  const onFeatureTypeClose = () => {
    closeMapFeatureType(name);
  };

  const itemProps = { map };

  const trigger = <div className={listStyles.trigger}>
    <h6>{name}</h6>
  </div>;

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    trigger={trigger}
    onClosing={onFeatureTypeClose}
    onOpening={onFeatureTypeOpen}
    open={collapsibleShouldBeOpen} >
    <CheckableList
      items={features}
      className={`${listStyles.list} ${listStyles.itemList} ${styles.featureItemList} ${listStyles.compressed}`}
      itemProps={itemProps}
      itemFullyChecked={featureIsVisible}
      onCheckClick={onCheckToggle}
      itemComponent={FeatureListItem}
    />
  </Collapsible>;
};

const mapStateToProps = (state) => {
  const { view: { hiddenFeatureIDs, openMapFeatureTypeNames } } = state;

  return ({
    hiddenFeatureIDs,
    openMapFeatureTypeNames
  });
};

export default connect(mapStateToProps, { hideFeatures, showFeatures, openMapFeatureType, closeMapFeatureType })(memo(FeatureTypeListItem));