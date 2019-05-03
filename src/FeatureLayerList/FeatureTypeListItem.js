import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';

import  { hideFeatures, showFeatures } from '../ducks/map-ui';

import CheckableList from '../CheckableList';
import FeatureListItem from './FeatureListItem';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};


const FeatureTypeListItem = (props) => {
  const { name, features, hiddenFeatureIDs, hideFeatures, showFeatures, map } = props;

  const trigger = <h6 className={listStyles.trigger}>{name}</h6>
  const itemProps = { map };

  const isVisible = item => !hiddenFeatureIDs.includes(item.properties.pk);

  const onCheckToggle = item => {
    const { properties: { pk:id } } = item;
    if (isVisible(item)) return hideFeatures(id);
    return showFeatures(id);
  }

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    trigger={trigger}>
    <CheckableList
      items={features}
      className={`${listStyles.list} ${listStyles.itemList}`}
      itemProps={itemProps}
      itemFullyChecked={isVisible}
      onCheckClick={onCheckToggle}
      itemComponent={FeatureListItem}
    />
  </Collapsible>
};




const mapStateToProps = ({ view: { hiddenFeatureIDs } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(FeatureTypeListItem);