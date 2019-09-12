import React, { memo } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';

import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { getUniqueIDsFromFeatures } from '../utils/features';
import { trackEvent } from '../utils/analytics';

import CheckableList from '../CheckableList';
import AnalyzerFeatureTypeListItem from './AnalyzerFeatureTypeListItem';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const AnalyzerContent = memo((props) => {
  const { featuresByType, hideFeatures, showFeatures, hiddenFeatureIDs, name, map } = props;
  const trigger = <h5 className={listStyles.trigger}>{name}</h5>;

  const allVisible = type => !hiddenFeatureIDs.length || !intersection(hiddenFeatureIDs, getUniqueIDsFromFeatures(...type.features)).length;

  const someVisible = (type) => {
    const featureIDs = getUniqueIDsFromFeatures(...type.features);
    return !allVisible(type) && intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
  };

  const onCheckToggle = (type) => {
    const featureIDs = getUniqueIDsFromFeatures(...type.features);
    if (allVisible(type)) {
      trackEvent('Map Layers', 'Uncheck Feature Set Type checkbox', 
        `Feature Set Type:${type.name}`);
      return hideFeatures(...featureIDs);
    } else {
      trackEvent('Map Layers', 'Check Feature Set Type checkbox', 
        `Feature Set Type:${type.name}`);
      return showFeatures(...featureIDs);
    }
  };

  const itemProps = { map };

  return <Collapsible
  {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
  className={listStyles.collapsed}
  openedClassName={listStyles.opened}
  trigger={trigger}>
  <CheckableList
    className={listStyles.list}
    items={featuresByType}
    itemProps={itemProps}
    itemFullyChecked={allVisible}
    itemPartiallyChecked={someVisible}
    onCheckClick={onCheckToggle}
    itemComponent={AnalyzerFeatureTypeListItem}
  />
</Collapsible>
});

const mapStateToProps = ({ view: { hiddenFeatureIDs } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(AnalyzerContent);