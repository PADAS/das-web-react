import React from 'react';
import { connect } from 'react-redux';
import { hideFeatures, hideSubjects, displayReportsOnMapState, updateHeatmapSubjects, updateTrackState } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { getFeatureLayerListState } from '../FeatureLayerList/selectors';
import { getAllFeatureIDsInList } from '../utils/features';
import { trackEvent } from '../utils/analytics';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';

const ClearAllControl = (props) => {

  const { subjectGroups, featureList } = props;

  const clearAll = () => {
    const subjectIDs = getUniqueSubjectGroupSubjectIDs(...subjectGroups);
    props.hideSubjects(...subjectIDs);
    const featureListIDs = getAllFeatureIDsInList(featureList);
    props.hideFeatures(...featureListIDs);
    props.displayReportsOnMapState(false);
    props.updateTrackState({ visible: [], pinned: [], });
    props.updateHeatmapSubjects([]);
  };

  const onClearAllClick = (e) => {
    trackEvent('Map Layer', 'Clicked Clear All link');
    clearAll();
  };

  return <div className={styles.clearAllRow}>
    <div>
      <CheckIcon className={styles.checkmark} onClick={() => onClearAllClick()} />
      <button onClick={() => onClearAllClick()}>Clear All</button>
    </div>
  </div>;
};

const mapStateToProps = (state) => {
  const { data } = state;
  const { subjectGroups, mapEvents } = data;

  return ({
    subjectGroups,
    featureList: getFeatureLayerListState(state),
    mapEvents
  });
};

export default connect(mapStateToProps, {
  displayReportsOnMapState, hideSubjects,
  hideFeatures, updateTrackState, updateHeatmapSubjects
})(ClearAllControl);
