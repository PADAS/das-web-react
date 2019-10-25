import React, { memo, useState } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import uniq from 'lodash/uniq';

import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';

import CheckableList from '../CheckableList';
import FeatureListItem from './FeatureListItem';

import listStyles from '../SideBar/styles.module.scss';
import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const FeatureTypeListItem = (props) => {
  const { name, features, hiddenFeatureIDs, hideFeatures, showFeatures, map,
    featureFilterEnabled } = props;

  const [openFeatureTypes, setOpenFeatureTypes] = useState([]);

  if (featureFilterEnabled && !features.length) return null;

  const featureIsVisible = item => !hiddenFeatureIDs.includes(item.properties.id);

  const onCheckToggle = (item) => {
    const { properties: { id } } = item;
    if (featureIsVisible(item)) {
      trackEvent('Map Layer', 'Uncheck Feature checkbox');
      return hideFeatures(id);
    } else {
      trackEvent('Map Layer', 'Check Feature checkbox');
      return showFeatures(id);
    }
  };

  const collapsibleShouldBeOpen = (featureFilterEnabled && !!features.length) || openFeatureTypes.includes(name);

  const onFeatureTypeOpen = () => {
    console.log('adding ', name);
    const featureTypes = uniq([...openFeatureTypes, name]);
    setOpenFeatureTypes(featureTypes);
  };

  const onFeatureTypeClose = () => {
    console.log('removing ', name);
    const featureTypes = openFeatureTypes.filter((f) => f !== name);
    setOpenFeatureTypes(featureTypes);
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

const mapStateToProps = ({ view: { hiddenFeatureIDs } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(FeatureTypeListItem));