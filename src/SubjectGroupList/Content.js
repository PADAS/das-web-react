import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';

import CheckableList from '../CheckableList';
import HeatmapToggleButton from '../HeatmapToggleButton';
import SubjectListItem from './SubjectListItem';

import { addHeatmapSubjects, removeHeatmapSubjects } from '../ducks/map-ui';
import { subjectGroupHeatmapControlState } from './selectors';

import { fetchTracksIfNecessary } from '../utils/tracks';

import { getUniqueSubjectGroupSubjectIDs } from '../utils/subjects';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const subjectsTranslationKeys = {
  subjects: 'subjectsTitle'
};

const TriggerComponent = memo((props) => { // eslint-disable-line react/display-name
  const { listLevel, name, showHeatmapControl, groupIsFullyHeatmapped, loadingTracks, groupIsPartiallyHeatmapped, onGroupHeatmapToggle } = props;
  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });
  const translationKey = subjectsTranslationKeys[name.toLowerCase()];
  const itemTitle = !!translationKey ? t(translationKey) : name;

  return <div className={listStyles.trigger}>
    {listLevel === 0 && <h5>{itemTitle}</h5>}
    {listLevel > 0 && <h6>{itemTitle}</h6>}
    {showHeatmapControl && <HeatmapToggleButton className={listStyles.toggleButton} loading={loadingTracks}
      heatmapVisible={groupIsFullyHeatmapped}
      heatmapPartiallyVisible={groupIsPartiallyHeatmapped}
      onButtonClick={onGroupHeatmapToggle} showLabel={false} />}
  </div>;
});

const ContentComponent = (props) => {
  const { subgroups, subjects, name, map, onGroupCheckClick, onSubjectCheckClick,
    hiddenSubjectIDs, subjectIsVisible, subjectFilterEnabled, subjectMatchesFilter,
    addHeatmapSubjects, removeHeatmapSubjects, showHeatmapControl, listLevel,
    groupIsFullyHeatmapped, groupIsPartiallyHeatmapped, unloadedSubjectTrackIDs } = props;

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

  const onGroupHeatmapToggle = async (e) => {
    const { heatmapEligibleSubjectIDs, groupIsFullyHeatmapped } = props;

    e.stopPropagation();
    if (groupIsFullyHeatmapped) {
      mapLayerTracker.track('Uncheck Group Heatmap checkbox', `Group:${name}`);
      return removeHeatmapSubjects(...heatmapEligibleSubjectIDs);
    }

    setTrackLoadingState(true);
    if (unloadedSubjectTrackIDs.length) {
      await fetchTracksIfNecessary(unloadedSubjectTrackIDs);
    }

    setTrackLoadingState(false);

    mapLayerTracker.track('Check Group Heatmap checkbox', `Group:${name}`);
    return addHeatmapSubjects(...heatmapEligibleSubjectIDs);
  };

  if (!name) return null;
  if (!subgroups.length && !subjects.length) return null;

  const subjectItemProps = {
    map,
  };

  const triggerProps = {
    listLevel, name, showHeatmapControl, groupIsFullyHeatmapped,
    loadingTracks, groupIsPartiallyHeatmapped, onGroupHeatmapToggle,
  };

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

const mapStateToProps = (state, ownProps) => subjectGroupHeatmapControlState(state, ownProps);

const ConnectedComponent = connect(mapStateToProps, { addHeatmapSubjects, removeHeatmapSubjects })(memo(ContentComponent));
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
