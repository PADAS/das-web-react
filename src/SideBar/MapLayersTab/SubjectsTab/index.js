import React, { useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getSubjectGroups } from '../../../selectors/subjects';
import { getUniqueSubjectGroupSubjects } from '../../../utils/subjects';
import { hideSubjects, showSubjects } from '../../../ducks/map-layer-filter';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { MapContext } from '../../../App';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../../constants';

import CheckableList from '../../../CheckableList';
import Content from './Content';
import SubjectListItem from './SubjectListItem';

import * as styles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const filterSubjectsByTextAndEmptySubjectGroupsRecursively = (subjectGroup, filterText) => {
  let newSubjectGroup = { ...subjectGroup };
  if (newSubjectGroup.subjects && filterText) {
    // If the current subject group has subjects and there is a filter text,
    // filter the subjects that match the text.
    const lowerCaseFilterText = filterText.toLowerCase();
    newSubjectGroup.subjects = subjectGroup.subjects.filter(
      (subject) => subject.name.toLowerCase().includes(lowerCaseFilterText)
    );
  }

  if (newSubjectGroup.subgroups) {
    // If the current subject group has sub-groups, filter them recursively and
    // remove the ones that are empty after the filtering.
    newSubjectGroup.subgroups = newSubjectGroup.subgroups
      .map((subjectSubgroup) => filterSubjectsByTextAndEmptySubjectGroupsRecursively(subjectSubgroup, filterText))
      .filter((subjectSubgroup) => subjectSubgroup.subjects.length > 0 || !!subjectSubgroup.subgroups.length > 0);
  }

  return newSubjectGroup;
};

const alphabeticCompareFunction = (sortDirection) => (itemA, itemB) => {
  if (itemA.name.toLowerCase() > itemB.name.toLowerCase()) {
    return sortDirection === SORT_DIRECTION.down ? 1 : -1;
  }
  return sortDirection === SORT_DIRECTION.down ? -1 : 1;
};

// TODO: This method sorts by the updated_at value of the subject, but not
// by its last track time which I guess is what users want (?).
const lastUpdateCompareFunction = (sortDirection) => (subjectA, subjectB) => {
  if (new Date(subjectB.updated_at) > new Date(subjectA.updated_at)) {
    return sortDirection === SORT_DIRECTION.down ? 1 : -1;
  }
  return sortDirection === SORT_DIRECTION.down ? -1 : 1;
};

const SubjectsTab = () => {
  const dispatch = useDispatch();

  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);
  const subjectGroups = useSelector(getSubjectGroups);

  const map = useContext(MapContext);

  const filteredSubjectGroups = useMemo(
    () => subjectGroups
      .map((subjectGroup) => filterSubjectsByTextAndEmptySubjectGroupsRecursively(subjectGroup, mapLayerFilter.text))
      .filter((subjectGroup) => subjectGroup.subgroups.length > 0 || subjectGroup.subjects.length > 0),
    [mapLayerFilter.text, subjectGroups]
  );

  const flatSubjectGroups = useMemo(() => {
    if (!mapLayerFilter.grouped) {
      // If the user turned off the group option, flatten the subjects from the
      // subject groups recursively.
      const flattenSubjectGroupsRecursively = (subjectGroup) => subjectGroup.subgroups.reduce(
        (accumulator, subGroup) => [...accumulator, ...flattenSubjectGroupsRecursively(subGroup)],
        [...subjectGroup.subjects]
      );
      const flatSubjectGroups = filteredSubjectGroups.reduce(
        (accumulator, subjectGroup) => [...accumulator, ...flattenSubjectGroupsRecursively(subjectGroup)],
        [],
      );

      // Remove duplicates.
      const flatSubjectGroupsMappedById = flatSubjectGroups.reduce(
        (accumulator, subject) => {
          if (!accumulator[subject.id]) {
            accumulator[subject.id] = subject;
          }
          return accumulator;
        },
        {}
      );
      return Object.values(flatSubjectGroupsMappedById);
    }

    return null;
  }, [filteredSubjectGroups, mapLayerFilter.grouped]);

  const sortedSubjectGroups = useMemo(() => {
    const compareFunction = mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE
      ? lastUpdateCompareFunction(mapLayerFilter.sortDirection)
      : alphabeticCompareFunction(mapLayerFilter.sortDirection);

    if (flatSubjectGroups) {
      // If the subject groups were flattened, sort the flat array of subjects.
      return flatSubjectGroups.sort(compareFunction);
    }

    const sortSubjectGroupsRecursively = (subjectGroup) => {
      // Start by recursively sorting the content of the sub-groups.
      subjectGroup.subgroups.forEach((subjectSubgroup) => sortSubjectGroupsRecursively(subjectSubgroup));

      // Sort sub-groups and subjects of the current subject group.
      subjectGroup.subgroups.sort(compareFunction);
      subjectGroup.subjects.sort(compareFunction);
    };

    // Sort the content of each subject group.
    filteredSubjectGroups.forEach((subjectGroup) => sortSubjectGroupsRecursively(subjectGroup));

    // Finally, sort the first level subject groups themselves.
    return filteredSubjectGroups.sort(compareFunction);
  }, [filteredSubjectGroups, flatSubjectGroups, mapLayerFilter.sortBy, mapLayerFilter.sortDirection]);

  const isSubjectVisible = (subject) => !mapLayerFilter.hiddenSubjectIDs.includes(subject.id);

  const isSubjectGroupFullyVisible = (subjectGroup) => !getUniqueSubjectGroupSubjects(subjectGroup)
    .some((subject) => !isSubjectVisible(subject));

  const isSubjectGroupPartiallyVisible = (subjectGroup) => {
    const subjects = getUniqueSubjectGroupSubjects(subjectGroup);

    return subjects.some((subject) => isSubjectVisible(subject))
      && subjects.some((subject) => !isSubjectVisible(subject));
  };

  const onSubjectCheckClick = (subject) => dispatch(isSubjectGroupFullyVisible(subject)
    ? hideSubjects(subject.id)
    : showSubjects(subject.id));

  const onSubjectGroupCheckClick = (subjectGroup) => {
    const subjectIds = getUniqueSubjectGroupSubjects(subjectGroup).map((subject) => subject.id);

    if (isSubjectGroupFullyVisible(subjectGroup)) {
      dispatch(hideSubjects(...subjectIds));

      mapLayerTracker.track('Uncheck Group Map Layer checkbox', `Group:${subjectGroup.name}`);
    } else {
      dispatch(showSubjects(...subjectIds));

      mapLayerTracker.track('Check Group Map Layer checkbox', `Group:${subjectGroup.name}`);
    }
  };

  if (sortedSubjectGroups.length === 0) {
    return null;
  }
  return mapLayerFilter.grouped ? <CheckableList
    className={styles.list}
    id="subjectgroups"
    itemFullyChecked={isSubjectGroupFullyVisible}
    itemComponent={Content}
    itemPartiallyChecked={isSubjectGroupPartiallyVisible}
    itemProps={{
      hiddenSubjectIDs: mapLayerFilter.hiddenSubjectIDs,
      listLevel: 0,
      map,
      onGroupCheckClick: onSubjectGroupCheckClick,
      onSubjectCheckClick,
      subjectFilterEnabled: mapLayerFilter.text.length > 0,
      subjectIsVisible: isSubjectVisible,
    }}
    items={sortedSubjectGroups}
    onCheckClick={onSubjectGroupCheckClick}
  /> : <CheckableList
    className={styles.flatCheckableList}
    items={sortedSubjectGroups}
    itemProps={{ map }}
    itemFullyChecked={isSubjectVisible}
    onCheckClick={onSubjectCheckClick}
    itemComponent={SubjectListItem}
  />;
};

export default SubjectsTab;
