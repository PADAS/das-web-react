import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Checkmark from '../Checkmark';
import Collapsible from 'react-collapsible';
import debounceRender from 'react-debounce-render';
import intersection from 'lodash/intersection';
import isEqual from 'react-fast-compare';
import { hideAnalyzers, showAnalyzers } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects, filterSubjects } from '../utils/subjects';
import { trackEvent } from '../utils/analytics';
import CheckableList from '../CheckableList';
import AnalyzerListItem from './AnalyzerListItem';

import listStyles from '../SideBar/styles.module.scss';


const AnalyzersList = (props) => {
  const { analyzers, hiddenAnalyzerIDs, map } = props;

  console.log('hiddenAnalyzerIDs', hiddenAnalyzerIDs);

  const itemFullyChecked = true; //TODO

  const someAnalyzersVisible = set => {
    return true
  };

  const groupIsFullyVisible = () => true;

  const groupIsPartiallyVisible = (group) => { //TODO
    //const analyzerIDs = getUniqueAnalyzerIDs(group);
    return true
  };

  const collapsibleShouldBeOpen = false; //!!analyzers.length;

  const onGroupCheckClick = (group) => {
    console.log('groupCheck clicked');
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

  const itemProps = { map, groupIsPartiallyVisible };

  const trigger = <div>
    <Checkmark onClick={onGroupCheckClick} fullyChecked={itemFullyChecked} partiallyChecked={groupIsPartiallyVisible} />
    <h6 className={listStyles.trigger}>Analyzers</h6>
  </div>;

  return /*!!filteredAnalyzerGroups.length &&*/ <Collapsible
    className={listStyles.collapsed}
    openedClassName={listStyles.group}
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
      itemFullyChecked={groupIsFullyVisible}
      itemPartiallyChecked={someAnalyzersVisible} />
  </Collapsible>
}, (prev, current) =>
  isEqual(prev.map && current.map) && isEqual(prev.analyzers, current.analyzers)
  ;

const mapStateToProps = ({ data: { analyzerFeatures }, view: { hiddenAnalyzerIDs } }) =>
  ({ analyzerFeatures, hiddenAnalyzerIDs });

export default connect(mapStateToProps, { hideAnalyzers, showAnalyzers })(memo(AnalyzerGroupList));


AnalyzerGroupList.defaultProps = {
  map: {},
};

AnalyzerGroupList.propTypes = {
  map: PropTypes.object,
};