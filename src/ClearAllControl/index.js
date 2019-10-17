import React from 'react';
import { connect } from 'react-redux';
import { hideFeatures, hideSubjects, displayReportsOnMapState, updateHeatmapSubjects, updateTrackState } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { INITIAL_TRACK_STATE } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';

const ClearAllControl = (props) => {

  const { subjectGroups } = props;

  const clearAll = () => {
    // Note: no longer removing the map features in a clear all
    const subjectIDs = getUniqueSubjectGroupSubjectIDs(...subjectGroups);
    props.hideSubjects(...subjectIDs);
    props.displayReportsOnMapState(false);
    props.updateTrackState(INITIAL_TRACK_STATE);
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
  const { data: { subjectGroups, mapEvents } } = state;

  return ({
    subjectGroups,
    mapEvents
  });
};

export default connect(mapStateToProps, {
  displayReportsOnMapState, hideSubjects,
  hideFeatures, updateTrackState, updateHeatmapSubjects
})(ClearAllControl);
