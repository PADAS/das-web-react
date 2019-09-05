import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import isEqual from 'react-fast-compare';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects } from '../utils/subjects';
import { trackEvent } from '../utils/analytics';
import CheckableList from '../CheckableList';

import Content from './Content';
import listStyles from '../SideBar/styles.module.scss';


const SubjectGroupList = memo((props) => {
  const { subjectGroups, mapLayerFilter, hideSubjects, showSubjects, hiddenSubjectIDs, map } = props;

  const [searchText, setSearchTextState] = useState('');
  const [subjectFilterEnabled, setsubjectFilterEnabledState] = useState(false);

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

  const subjectMatchesFilter = (subject) => {
    if (searchText.length === 0) return true;
    return (subject.name.toLowerCase().includes(searchText));
  };

  useEffect(() => {
    const filterText = mapLayerFilter.filter.text || '';
    setSearchTextState(filterText);
    setsubjectFilterEnabledState(filterText.length > 0);
  }, [mapLayerFilter]);

  const itemProps = {
    map,
    onGroupCheckClick,
    onSubjectCheckClick,
    hiddenSubjectIDs,
    subjectIsVisible,
    subjectFilterEnabled,
    subjectMatchesFilter,
  };

  return <CheckableList
    className={listStyles.list}
    id='subjectgroups'
    onCheckClick={onGroupCheckClick}
    itemComponent={Content}
    itemProps={itemProps}
    items={subjectGroups}
    itemFullyChecked={groupIsFullyVisible}
    itemPartiallyChecked={groupIsPartiallyVisible} />
}, (prev, current) =>
    isEqual(prev.map && current.map) && isEqual(prev.hiddenSubjectIDs, current.hiddenSubjectIDs) && isEqual(prev.subjectGroups.length, current.subjectGroups.length)
);

const mapStateToProps = ({ data: { subjectGroups, mapLayerFilter }, view: { hiddenSubjectIDs } }) => 
  ({ subjectGroups, mapLayerFilter, hiddenSubjectIDs });
export default connect(mapStateToProps, { hideSubjects, showSubjects })(SubjectGroupList);

SubjectGroupList.defaultProps = {
  map: {},
};

SubjectGroupList.propTypes = {
  map: PropTypes.object,
};
