import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects, filterSubjects } from '../utils/subjects';
import { trackEvent } from '../utils/analytics';
import { getSubjectGroups } from '../selectors/subjects';
import CheckableList from '../CheckableList';

import Content from './Content';
import listStyles from '../SideBar/styles.module.scss';


const SubjectGroupList = (props) => {
  const { subjectGroups, mapLayerFilter, hideSubjects, showSubjects, hiddenSubjectIDs, map } = props;

  const searchText = useMemo(() => mapLayerFilter.filter.text || '', [mapLayerFilter.filter.text]);

  const subjectFilterEnabled = searchText.length > 0;

  const subjectFilterIsMatch = useCallback((subject) => {
    if (searchText.length === 0) return true;
    return (subject.name.toLowerCase().includes(searchText));
  }, [searchText]);

  const groupsInList = useMemo(() => {
    return subjectFilterEnabled ?
      filterSubjects(subjectGroups, subjectFilterIsMatch) :
      subjectGroups.filter(g => !!g.subgroups.length || !!g.subjects.length);
  }, [subjectFilterEnabled, subjectFilterIsMatch, subjectGroups]);

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
  };

  const onSubjectCheckClick = (subject) => {
    if (subjectIsVisible(subject)) return hideSubjects(subject.id);
    return showSubjects(subject.id);
  };

  const subjectIsVisible = subject => !hiddenSubjectIDs.includes(subject.id);

  const onGroupCheckClick = (group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
    if (groupIsFullyVisible(group)) {
      trackEvent('Map Layers', 'Uncheck Group Map Layer checkbox', `Group:${group.name}`);
      return hideSubjects(...subjectIDs);
    } else {
      trackEvent('Map Layers', 'Check Group Map Layer checkbox', `Group:${group.name}`);
      return showSubjects(...subjectIDs);
    }
  };

  const listLevel = 0;

  const itemProps = {
    map,
    onGroupCheckClick,
    onSubjectCheckClick,
    hiddenSubjectIDs,
    subjectIsVisible,
    subjectFilterEnabled,
    subjectFilterIsMatch,
    listLevel,
  };

  return !!groupsInList.length && <CheckableList
    className={listStyles.list}
    id='subjectgroups'
    onCheckClick={onGroupCheckClick}
    itemComponent={Content}
    itemProps={itemProps}
    items={groupsInList}
    itemFullyChecked={groupIsFullyVisible}
    itemPartiallyChecked={groupIsPartiallyVisible} />;
};

const mapStateToProps = (state) => {
  const { data: { mapLayerFilter }, view: { hiddenSubjectIDs } } = state;
  return { subjectGroups: getSubjectGroups(state), mapLayerFilter, hiddenSubjectIDs };
};

export default connect(mapStateToProps, { hideSubjects, showSubjects })(memo(SubjectGroupList));

SubjectGroupList.defaultProps = {
  map: {},
};

SubjectGroupList.propTypes = {
  map: PropTypes.object,
};
