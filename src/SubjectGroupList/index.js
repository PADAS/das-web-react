import React, { memo, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  filterSubjects,
  getUniqueSubjectGroupSubjects,
} from '../utils/subjects';
import { getSubjectGroups } from '../selectors/subjects';
import { hideSubjects, showSubjects } from '../ducks/map-layer-filter';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../constants';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../utils/analytics';
import { MapContext } from '../App';

import CheckableList from '../CheckableList';
import Content from './Content';
import SubjectListItem from './SubjectListItem';

import * as listStyles from '../SideBar/styles.module.scss';
import { uniqBy } from 'lodash-es';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const SubjectGroupList = () => {
  const dispatch = useDispatch();

  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);
  const subjectGroups = useSelector(getSubjectGroups);

  const map = useContext(MapContext);

  const { filteredSubjectGroups, flat } = useMemo(() => {
    const doesSubjectMatchFilterText = (subject) =>
      subject.name.toLowerCase().includes(mapLayerFilter.text.toLowerCase());

    // Filter the subject groups and subjects by text match.
    const filteredSubjectGroups = mapLayerFilter.text.length > 0
      ? filterSubjects(subjectGroups, doesSubjectMatchFilterText)
      : subjectGroups.filter((subjectGroup) => !!subjectGroup.subgroups.length || !!subjectGroup.subjects.length);

    let flatSubjectGroups;
    if (!mapLayerFilter.grouped) {
      const flattenSubjectGroups = (subjectGroup) => subjectGroup.subgroups.reduce(
        (accumulator, subGroup) => [...accumulator, ...flattenSubjectGroups(subGroup)],
        [...subjectGroup.subjects]
      );

      flatSubjectGroups = filteredSubjectGroups.reduce(
        (accumulator, subjectGroup) => [...accumulator, ...flattenSubjectGroups(subjectGroup)],
        [],
      );

      flatSubjectGroups = uniqBy(flatSubjectGroups, 'id');
    }

    const alphabeticCompareFunction = (itemA, itemB) => {
      if (itemA.name.toLowerCase() > itemB.name.toLowerCase()) {
        return mapLayerFilter.sortDirection === SORT_DIRECTION.down ? 1 : -1;
      }
      return mapLayerFilter.sortDirection === SORT_DIRECTION.down ? -1 : 1;
    };
    // TODO: This method sorts by the updated_at value of the subject, but not
    // by its last track time which I guess is what users want (?).
    const lastUpdateCompareFunction = (subjectA, subjectB) => {
      if (new Date(subjectB.updated_at) > new Date(subjectA.updated_at)) {
        return mapLayerFilter.sortDirection === SORT_DIRECTION.down ? 1 : -1;
      }
      return mapLayerFilter.sortDirection === SORT_DIRECTION.down ? -1 : 1;
    };

    if (flatSubjectGroups) {
      return {
        filteredSubjectGroups: flatSubjectGroups.sort(mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
          ? lastUpdateCompareFunction
          : alphabeticCompareFunction),
        flat: true,
      };
    }

    // Sort the subject groups and subjects of a group recursivelly.
    const sortSubjectGroupsRecursivelly = (subjectGroup) => {
      // Start by sorting the nested subgroups.
      subjectGroup.subgroups.forEach((subjectSubGroup) => sortSubjectGroupsRecursivelly(subjectSubGroup));

      // Sort subgroups and subjects.
      subjectGroup.subgroups.sort(mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
        ? lastUpdateCompareFunction
        : alphabeticCompareFunction);
      subjectGroup.subjects.sort(mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
        ? lastUpdateCompareFunction
        : alphabeticCompareFunction);

      // Calculate the updated at value of this group.
      let updatedAt;
      subjectGroup.subgroups.forEach((subGroup) => {
        if (!updatedAt || new Date(subGroup.updated_at) > new Date (updatedAt)) {
          updatedAt = subGroup.updated_at;
        }
      });
      subjectGroup.subjects.forEach((subject) => {
        if (!updatedAt || new Date(subject.updated_at) > new Date (updatedAt)) {
          updatedAt = subject.updated_at;
        }
      });
      subjectGroup.updated_at = updatedAt;
    };

    // Sort the content of each first level subject group.
    filteredSubjectGroups.forEach((subjectGroup) => sortSubjectGroupsRecursivelly(subjectGroup));

    // Now sort the first level subject groups themselves.
    return {
      filteredSubjectGroups: filteredSubjectGroups.sort(mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
        ? lastUpdateCompareFunction
        : alphabeticCompareFunction),
      flat: false,
    };
  }, [mapLayerFilter, subjectGroups]);

  const groupIsFullyVisible = (group) => !getUniqueSubjectGroupSubjects(group)
    .map((subject) => subject.id)
    .some((subjectId) => mapLayerFilter.hiddenSubjectIDs.includes(subjectId));

  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, mapLayerFilter.hiddenSubjectIDs) && !groupSubjectIDs.every(id => mapLayerFilter.hiddenSubjectIDs.includes(id));
  };

  const onSubjectCheckClick = (subject) => {
    if (subjectIsVisible(subject)) return dispatch(hideSubjects(subject.id));
    return dispatch(showSubjects(subject.id));
  };

  const subjectIsVisible = subject => !mapLayerFilter.hiddenSubjectIDs.includes(subject.id);

  const onGroupCheckClick = (group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
    if (groupIsFullyVisible(group)) {
      mapLayerTracker.track('Uncheck Group Map Layer checkbox', `Group:${group.name}`);
      return dispatch(hideSubjects(...subjectIDs));
    } else {
      mapLayerTracker.track('Check Group Map Layer checkbox', `Group:${group.name}`);
      return dispatch(showSubjects(...subjectIDs));
    }
  };

  if (filteredSubjectGroups.length > 0) {
    if (flat) {
      return <CheckableList
        className={listStyles.flatCheckableList}
        items={filteredSubjectGroups}
        itemProps={{ map }}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem}
      />;
    } else {
      return <CheckableList
        className={listStyles.list}
        id="subjectgroups"
        itemFullyChecked={groupIsFullyVisible}
        itemComponent={Content}
        itemPartiallyChecked={groupIsPartiallyVisible}
        itemProps={{
          hiddenSubjectIDs: mapLayerFilter.hiddenSubjectIDs,
          listLevel: 0,
          map,
          onGroupCheckClick,
          onSubjectCheckClick,
          subjectFilterEnabled: mapLayerFilter.text.length > 0,
          subjectIsVisible,
        }}
        items={filteredSubjectGroups}
        onCheckClick={onGroupCheckClick}
      />;
    }
  }
  return null;
};

export default memo(SubjectGroupList);
