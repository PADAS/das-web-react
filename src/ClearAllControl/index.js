import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { hideFeatures, hideSubjects, clearMapItemsState } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { getFeatureLayerListState } from '../FeatureLayerList/selectors';
import { getAllFeatureIDsInList } from '../utils/features';
import { trackEvent } from '../utils/analytics';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';

const ClearAllControl = (props) => {

  const { subjectGroups, featureList, map } = props;

  const clearAll = () => {
    const subjectIDs = getUniqueSubjectGroupSubjectIDs(...subjectGroups);
    props.hideSubjects(...subjectIDs);
    const featureListIDs = getAllFeatureIDsInList(featureList);
    props.hideFeatures(...featureListIDs);
  }
  const onClearAllClick = (e) => {
    trackEvent('Map Layer', 'Clicked Clear All link');
    clearAll();
  };

  return <div className={styles.clearAllRow}>
    <div className={styles.clearAll}><CheckIcon style={{height: '1.5rem', width: '1.5rem', stroke: '#000', fill: '#fff'}} />
    <a href="#" onClick={() => onClearAllClick()}>Clear All</a></div>
  </div>
};

const mapStateToProps = (state) => {
  const { data, view } = state;
  const { clearMapItems } = view;
  const { subjectGroups, mapEvents } = data;

  return ({
    clearMapItems,
    subjectGroups,
    featureList: getFeatureLayerListState(state),
    mapEvents
  });
};

export default connect(mapStateToProps, { clearMapItemsState, hideSubjects, hideFeatures }) (ClearAllControl);
