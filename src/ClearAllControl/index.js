import React, { memo } from 'react';
import { connect } from 'react-redux';
import { hideSubjects, displayReportsOnMapState, updateHeatmapSubjects, updateTrackState } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { INITIAL_TRACK_STATE } from '../ducks/map-ui';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { getSubjectGroups } from '../selectors/subjects';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const ClearAllControl = (props) => {

  const { subjectGroups, hideSubjects, displayReportsOnMapState, updateTrackState, updateHeatmapSubjects } = props;

  const clearAll = () => {
    // Note: no longer removing the map features in a clear all
    const subjectIDs = getUniqueSubjectGroupSubjectIDs(...subjectGroups);
    hideSubjects(...subjectIDs);
    displayReportsOnMapState(false);
    updateTrackState(INITIAL_TRACK_STATE);
    updateHeatmapSubjects([]);
  };

  const onClearAllClick = () => {
    mapLayerTracker.track('Clicked Clear All link');
    clearAll();
  };

  return <div className={styles.clearAllRow}>
    <div>
      <button onClick={() => onClearAllClick()}>
        <CheckIcon className={styles.checkmark} onClick={() => onClearAllClick()} />Clear All
      </button>
    </div>
  </div>;
};

const mapStateToProps = (state) => {
  return ({
    subjectGroups: getSubjectGroups(state),
  });
};

export default connect(mapStateToProps, {
  displayReportsOnMapState, hideSubjects,
  updateTrackState, updateHeatmapSubjects
})(memo(ClearAllControl));
