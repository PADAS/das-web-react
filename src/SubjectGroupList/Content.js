import React, { memo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';

import CheckableList from '../CheckableList';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';
import SubjectListItem from './SubjectListItem';

import { TRACKING_CONTROL_STATES } from '../constants';

import { addHeatmapSubjects, hideSubjectTracks, pinSubjectTracks, removeHeatmapSubjects, showSubjectTracks } from '../ducks/map-ui';
import { groupTrackingDataState, unloadedSubjectTrackIDs, visibleTrackingDataSubjectIDsForGroup } from './selectors';

import { fetchTracksIfNecessary } from '../utils/tracks';

import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import * as listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const TriggerComponent = memo((props) => {  // eslint-disable-line react/display-name
  const {
    listLevel,
    name,
    showTrackingControls,
    loadingTracks,
    groupTrackState,
    onGroupHeatmapToggle,
    onTrackButtonClick,
  } = props;

  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });
  const itemTitle = name === 'Subjects' ? t('subjectsTitle') : name;

  const { heatmap, track } = groupTrackState;

  const fullyPinned = track === TRACKING_CONTROL_STATES.FULLY_PINNED;
  const partiallyPinned = track === TRACKING_CONTROL_STATES.PARTIALLY_PINNED;
  const fullyVisible = track === TRACKING_CONTROL_STATES.FULLY_VISIBLE;
  const partiallyVisible = track === TRACKING_CONTROL_STATES.PARTIALLY_VISIBLE;

  return <div className={listStyles.trigger} data-testid={`collapsible-${itemTitle}`}>
    {listLevel === 0 && <h5>{itemTitle}</h5>}
    {listLevel > 0 && <h6>{itemTitle}</h6>}
    {showTrackingControls && <>
      <TrackToggleButton
        loading={loadingTracks}
        onClick={onTrackButtonClick}
        className={`${(partiallyPinned || partiallyVisible) ? listStyles.partialTrackButton : ''}`}
        showLabel={false}
        trackPinned={fullyPinned || partiallyPinned}
        trackVisible={fullyVisible || partiallyVisible}
      />
      <HeatmapToggleButton className={listStyles.toggleButton} loading={loadingTracks}
        heatmapVisible={heatmap === TRACKING_CONTROL_STATES.FULLY_HEATMAPPED}
        heatmapPartiallyVisible={heatmap === TRACKING_CONTROL_STATES.PARTIALLY_HEATMAPPED}
        onButtonClick={onGroupHeatmapToggle} showLabel={false} />
    </>}
  </div>;
});

const ContentComponent = (props) => {
  const { subgroups, subjects, name, map, onGroupCheckClick, onSubjectCheckClick,
    subjectIsVisible, subjectFilterEnabled, subjectMatchesFilter,
    listLevel, } = props;

  const dispatch = useDispatch();
  const subjectIDsWithTrackingData = useSelector((state) => visibleTrackingDataSubjectIDsForGroup(state, props));
  const showTrackingControls = !!subjectIDsWithTrackingData.length;
  const groupTrackState = useSelector((state) => groupTrackingDataState(state, props));
  const subjectTrackIDsToLoad = useSelector((state) => unloadedSubjectTrackIDs(state, props));
  const hiddenSubjectIDs = useSelector(({ data: { mapLayerFilter: { hiddenSubjectIDs } } }) => hiddenSubjectIDs);

  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

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
    listLevel: listLevel + 1,
  };

  useEffect(() => {
    setCollapsibleOpenState(subjectFilterEnabled && (!!subgroups.length || !!subjects.length));
  }, [subgroups.length, subjectFilterEnabled, subjects.length]);

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

  const onTrackButtonClick = async (e) => {
    e.stopPropagation();

    if (subjectTrackIDsToLoad.length) {
      setTrackLoadingState(true);

      await fetchTracksIfNecessary(subjectTrackIDsToLoad);

      setTrackLoadingState(false);
    }

    if (groupTrackState.track === TRACKING_CONTROL_STATES.FULLY_PINNED) {
      return dispatch(hideSubjectTracks(...subjectIDsWithTrackingData));  // turn off all;
    }
    if (
      [TRACKING_CONTROL_STATES.PARTIALLY_PINNED, TRACKING_CONTROL_STATES.FULLY_VISIBLE]
        .includes(groupTrackState.track)
    ) {
      return dispatch(pinSubjectTracks(...subjectIDsWithTrackingData));
    }

    return dispatch(showSubjectTracks(...subjectIDsWithTrackingData));
  };

  const onGroupHeatmapToggle = async (e) => {
    const groupIsFullyHeatmapped = groupTrackState.heatmap === TRACKING_CONTROL_STATES.FULLY_HEATMAPPED;

    e.stopPropagation();
    if (groupIsFullyHeatmapped) {
      mapLayerTracker.track('Uncheck Group Heatmap checkbox', `Group:${name}`);
      return dispatch(removeHeatmapSubjects(...subjectIDsWithTrackingData));
    }

    setTrackLoadingState(true);
    if (subjectTrackIDsToLoad.length) {
      await fetchTracksIfNecessary(subjectTrackIDsToLoad);
    }

    setTrackLoadingState(false);

    mapLayerTracker.track('Check Group Heatmap checkbox', `Group:${name}`);
    return dispatch(addHeatmapSubjects(...subjectIDsWithTrackingData));
  };


  if (!name) return null;
  if (!subgroups.length && !subjects.length) return null;

  const subjectItemProps = {
    map,
  };

  const triggerProps = {
    listLevel, name, showTrackingControls, onTrackButtonClick,
    groupTrackState, loadingTracks, onGroupHeatmapToggle,
  };

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={<TriggerComponent {...triggerProps} />}
    triggerElementProps={{
      label: t(collapsibleShouldBeOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel'),
      title: t(collapsibleShouldBeOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle'),
    }}
    open={collapsibleShouldBeOpen}>
    {!!subgroups.length &&
      <CheckableList
        className={listStyles.list}
        items={subgroups}
        itemProps={groupItemProps}
        itemFullyChecked={groupIsFullyVisible}
        itemPartiallyChecked={groupIsPartiallyVisible}
        onCheckClick={onGroupCheckClick}
        itemComponent={ContentComponent} />
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

export default ContentComponent;
