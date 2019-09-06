import React, { memo } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';

import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { filterFeaturesets } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import CheckableList from '../CheckableList';
import FeatureListItem from './FeatureListItem';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};


const FeatureTypeListItem = memo((props) => {
  const { name, features, hiddenFeatureIDs, hideFeatures, showFeatures, map,
    featureFilterEnabled, featureMatchesFilter } = props;

  const featureIsVisible = item => !hiddenFeatureIDs.includes(item.properties.id);

  const onCheckToggle = (item) => {
    const { properties: { id } } = item;
    console.log('onCheckToggle item:');
    console.log(item);
    if (featureIsVisible(item)) {
      trackEvent('Map Layer', 'Uncheck Feature checkbox');
        return hideFeatures(id);
    } else {
      trackEvent('Map Layer', 'Check Feature checkbox');
      return showFeatures(id);
    }
  };

  const filteredFeatures = featureFilterEnabled ? 
    filterFeaturesets(features, featureMatchesFilter) : features;

  const collapsibleShouldBeOpen = featureFilterEnabled && !!filteredFeatures.length;

  const itemProps = { map };

  const trigger = <div className={listStyles.trigger}>
    <h6>{name}</h6>
  </div>;

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    trigger={trigger}
    open={collapsibleShouldBeOpen}
    triggerDisabled={featureFilterEnabled} >
    <CheckableList
      items={filteredFeatures}
      className={`${listStyles.list} ${listStyles.itemList} ${listStyles.compressed}`}
      itemProps={itemProps}
      itemFullyChecked={featureIsVisible}
      onCheckClick={onCheckToggle}
      itemComponent={FeatureListItem}
    />
  </Collapsible>
});




const mapStateToProps = ({ view: { hiddenFeatureIDs } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(FeatureTypeListItem);