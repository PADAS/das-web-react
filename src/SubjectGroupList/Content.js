import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import isEqual from 'react-fast-compare';
import debounceRender from 'react-debounce-render';
import intersection from 'lodash/intersection';

import CheckableList from '../CheckableList';
import HeatmapToggleButton from '../HeatmapToggleButton';
import SubjectListItem from './SubjectListItem';

import { addHeatmapSubjects, removeHeatmapSubjects } from '../ducks/map-ui';
import { subjectGroupHeatmapControlState } from './selectors';
import { fetchTracks } from '../ducks/tracks';

import { getUniqueSubjectGroupSubjectIDs, getHeatmapEligibleSubjectsFromGroups } from '../utils/subjects';

import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const ContentComponent = memo(debounceRender((props) => {
  const { subgroups, subjects, name, map, onGroupCheckClick, onSubjectCheckClick, hiddenSubjectIDs, subjectIsVisible, addHeatmapSubjects, removeHeatmapSubjects, showHeatmapControl, heatmapEligibleSubjectIDs, groupIsFullyHeatmapped, groupIsPartiallyHeatmapped, unloadedSubjectTrackIDs, ...rest } = props;

  const nonEmptySubgroups = subgroups.filter(g => !!g.subgroups.length || !!g.subjects.length);

  const [loadingTracks, setTrackLoadingState] = useState(false);

  const groupIsFullyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjectIDs(group);
    return !intersection(groupSubjectIDs, hiddenSubjectIDs).length;
  };

  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjectIDs(group);
    return !groupIsFullyVisible(group)
      && !!intersection(groupSubjectIDs, hiddenSubjectIDs).length
      && intersection(groupSubjectIDs, hiddenSubjectIDs).length !== groupSubjectIDs.length;
  };

  const groupItemProps = {
    map,
    onGroupCheckClick,
    onSubjectCheckClick,
    hiddenSubjectIDs,
    subjectIsVisible,
  };

  const subjectItemProps = {
    map,
  };

  const onGroupHeatmapToggle = async (e) => {
    const { heatmapEligibleSubjectIDs, groupIsFullyHeatmapped } = props;

    e.stopPropagation();
    if (groupIsFullyHeatmapped) return removeHeatmapSubjects(...heatmapEligibleSubjectIDs);
    
    setTrackLoadingState(true);
    console.log('should be loading');

    if (unloadedSubjectTrackIDs.length) await Promise.all(unloadedSubjectTrackIDs.map(id => props.fetchTracks(id)));
    
    setTrackLoadingState(false);
    console.log('no mo load');

    return addHeatmapSubjects(...heatmapEligibleSubjectIDs);
  };

  if (!name) return null;
  if (!subgroups.length && !subjects.length) return null;

  const trigger = <div>
    <h5>{name}</h5>
    {showHeatmapControl && <HeatmapToggleButton loading={loadingTracks} heatmapVisible={groupIsFullyHeatmapped} heatmapPartiallyVisible={groupIsPartiallyHeatmapped} onButtonClick={onGroupHeatmapToggle} showLabel={false} />}
  </div>;

  return <Collapsible
    className={styles.collapsed}
    openedClassName={styles.opened}
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={trigger}>
    {!!subgroups.length &&
      <CheckableList
        className={styles.list}
        items={nonEmptySubgroups}
        itemProps={groupItemProps}
        itemFullyChecked={groupIsFullyVisible}
        itemPartiallyChecked={groupIsPartiallyVisible}
        onCheckClick={onGroupCheckClick}
        itemComponent={ContentComponent} />
    }
    {!!subjects.length &&
      <CheckableList
        className={`${styles.list} ${styles.subjectList}`}
        items={subjects}
        itemProps={subjectItemProps}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>
}));

const mapStateToProps = (state, ownProps) => subjectGroupHeatmapControlState(state, ownProps);

export default connect(mapStateToProps, { addHeatmapSubjects, removeHeatmapSubjects, fetchTracks })(ContentComponent);

ContentComponent.defaultProps = {
  itemProps: {},
};

ContentComponent.propTypes = {
  subgroups: PropTypes.array.isRequired,
  itemProps: PropTypes.object,
  subjects: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  hiddenSubjectIDs: PropTypes.array,
}
