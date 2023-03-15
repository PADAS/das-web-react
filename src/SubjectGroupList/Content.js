import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';

import CheckableList from '../CheckableList';
import HeatmapToggleButton from '../HeatmapToggleButton';
import SubjectListItem from './SubjectListItem';

import { addHeatmapSubjects, removeHeatmapSubjects } from '../ducks/map-ui';
import {  } from './selectors';

import { groupIsFullyHeatmapped, groupIsPartiallyHeatmapped, heatmapEligibleSubjectIDsForGroup, unloadedSubjectTrackIDs } from './selectors';



import { fetchTracksIfNecessary } from '../utils/tracks';

import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const TriggerComponent = memo((props) => { // eslint-disable-line react/display-name
  const { listLevel, name, showHeatmapControl, fullyHeatmapped, loadingTracks, partiallyHeatmapped, onGroupHeatmapToggle } = props;
  return <div className={listStyles.trigger}>
    {listLevel === 0 && <h5>{name}</h5>}
    {listLevel > 0 && <h6>{name}</h6>}
    {showHeatmapControl && <HeatmapToggleButton className={listStyles.toggleButton} loading={loadingTracks}
      heatmapVisible={fullyHeatmapped}
      heatmapPartiallyVisible={partiallyHeatmapped}
      onButtonClick={onGroupHeatmapToggle} showLabel={false} />}
  </div>;
});

const ContentComponent = (props) => {
  const { subgroups = [], subjects = [], name, map, onGroupCheckClick, onSubjectCheckClick,
    hiddenSubjectIDs, subjectIsVisible, subjectFilterEnabled, subjectMatchesFilter,
    addHeatmapSubjects, removeHeatmapSubjects, listLevel } = props;

  const groupContentSummary = useMemo(() => ({
    subgroups,
    subjects,
  }), [subgroups, subjects]);

  const eligibleHeatmapSubjects = useSelector(state => heatmapEligibleSubjectIDsForGroup(state, groupContentSummary));
  const fullyHeatmapped = useSelector(state => groupIsFullyHeatmapped(state, groupContentSummary));
  const partiallyHeatmapped = useSelector(state => groupIsPartiallyHeatmapped(state, groupContentSummary));
  const unloadedTrackIds = useSelector(state => unloadedSubjectTrackIDs(state, groupContentSummary));

  const showHeatmapControl = !!eligibleHeatmapSubjects.length;

  const [loadingTracks, setTrackLoadingState] = useState(false);
  const [collapsibleShouldBeOpen, setCollapsibleOpenState] = useState(false);

  const groupItemProps = {
    map,
    onGroupCheckClick,
    onSubjectCheckClick,
    hiddenSubjectIDs,
    subjectIsVisible,
    subjectFilterEnabled,
    subjectMatchesFilter,
    listLevel: listLevel+1,
  };

  useEffect(() => {
    setCollapsibleOpenState(subjectFilterEnabled && (!!subgroups.length || !!subjects.length));
  }, [subgroups.length, subjectFilterEnabled, subjects.length]);

  const groupIsFullyVisible = useCallback((group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjectIDs(group);
    return !intersection(groupSubjectIDs, hiddenSubjectIDs).length;
  }, [hiddenSubjectIDs]);

  const groupIsPartiallyVisible = useCallback((group) => {
    if (groupIsFullyVisible(group)) return false;

    const groupSubjectIDs = getUniqueSubjectGroupSubjectIDs(group);

    const crossover = intersection(groupSubjectIDs, hiddenSubjectIDs);

    return !!crossover.length && crossover.length !== groupSubjectIDs.length;
  }, [groupIsFullyVisible, hiddenSubjectIDs]);

  const onGroupHeatmapToggle = useCallback(async (e) => {
    e.stopPropagation();
    if (fullyHeatmapped) {
      mapLayerTracker.track('Uncheck Group Heatmap checkbox', `Group:${name}`);
      return removeHeatmapSubjects(...eligibleHeatmapSubjects);
    }

    setTrackLoadingState(true);
    if (unloadedTrackIds.length) {
      await fetchTracksIfNecessary(unloadedTrackIds);
    }

    setTrackLoadingState(false);

    mapLayerTracker.track('Check Group Heatmap checkbox', `Group:${name}`);
    return addHeatmapSubjects(...eligibleHeatmapSubjects);
  }, [addHeatmapSubjects, eligibleHeatmapSubjects, fullyHeatmapped, name, unloadedTrackIds, removeHeatmapSubjects]);

  const triggerProps = useMemo(() => ({
    listLevel, name, showHeatmapControl, fullyHeatmapped, loadingTracks, partiallyHeatmapped, onGroupHeatmapToggle,
  }), [listLevel, name, showHeatmapControl, fullyHeatmapped, loadingTracks, partiallyHeatmapped, onGroupHeatmapToggle]);

  const subjectItemProps = useMemo(() => ({
    map,
  }), [map]);

  if (!name) return null;
  if (!subgroups.length && !subjects.length) return null;


  // const nonEmptySubgroups = subgroups.filter(g => !!g.subgroups.length || !!g.subjects.length);



  return <Collapsible
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={<TriggerComponent {...triggerProps} />}
    open={collapsibleShouldBeOpen}>
    {!!subgroups.length &&
      <CheckableList
        className={listStyles.list}
        items={subgroups}
        itemProps={groupItemProps}
        itemFullyChecked={groupIsFullyVisible}
        itemPartiallyChecked={groupIsPartiallyVisible}
        onCheckClick={onGroupCheckClick}
        itemComponent={ConnectedComponent} />
    }
    {!!subjects.length &&
      <CheckableList
        className={`${listStyles.list} ${listStyles.itemList}`}
        items={subjects}
        itemProps={subjectItemProps}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>;
};

const ConnectedComponent = connect(null, { addHeatmapSubjects, removeHeatmapSubjects })(memo(ContentComponent));
export default ConnectedComponent;

ContentComponent.defaultProps = {
  itemProps: {},
};

ContentComponent.propTypes = {
  subgroups: PropTypes.array.isRequired,
  itemProps: PropTypes.object,
  subjects: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  hiddenSubjectIDs: PropTypes.array,
};
