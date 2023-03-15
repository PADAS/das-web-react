import React, { memo, useCallback, useContext, useDeferredValue, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { LayerFilterContext } from '../MapLayerFilter/context';
import { getUniqueSubjectGroupSubjects, filterSubjects } from '../utils/subjects';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';
import { getSubjectGroups } from '../selectors/subjects';
import CheckableList from '../CheckableList';


import Content from './Content';
import listStyles from '../SideBar/styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const SubjectGroupList = (props) => {
  const { subjectGroups, hideSubjects, showSubjects, hiddenSubjectIDs, map } = props;


  const { filterText: filterFromContext } = useContext(LayerFilterContext);

  const filterText = useDeferredValue(filterFromContext);

  const subjectFilterEnabled = filterText.length > 0;

  const subjectFilterIsMatch = useCallback((subject) => {
    if (!subjectFilterEnabled) return true;
    return (subject.name.toLowerCase().includes(filterText));
  }, [filterText, subjectFilterEnabled]);

  const groupsInList = useMemo(() => {
    return subjectFilterEnabled ?
      filterSubjects(subjectGroups, subjectFilterIsMatch) :
      subjectGroups.filter(g => !!g.subgroups.length || !!g.subjects.length);
  }, [subjectFilterEnabled, subjectFilterIsMatch, subjectGroups]);

  const groupIsFullyVisible = useCallback(group =>
    !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id))
  , [hiddenSubjectIDs]);

  const groupIsPartiallyVisible = useCallback((group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
  }, [groupIsFullyVisible, hiddenSubjectIDs]);

  const subjectIsVisible = useCallback(subject => !hiddenSubjectIDs.includes(subject.id), [hiddenSubjectIDs]);

  const onSubjectCheckClick = useCallback((subject) => {
    if (subjectIsVisible(subject)) return hideSubjects(subject.id);
    return showSubjects(subject.id);
  }, [hideSubjects, showSubjects, subjectIsVisible]);


  const onGroupCheckClick = useCallback((group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
    if (groupIsFullyVisible(group)) {
      mapLayerTracker.track('Uncheck Group Map Layer checkbox', `Group:${group.name}`);
      return hideSubjects(...subjectIDs);
    } else {
      mapLayerTracker.track('Check Group Map Layer checkbox', `Group:${group.name}`);
      return showSubjects(...subjectIDs);
    }
  }, [groupIsFullyVisible, hideSubjects, showSubjects]);

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
  const { view: { hiddenSubjectIDs } } = state;
  return { subjectGroups: getSubjectGroups(state), hiddenSubjectIDs };
};

export default connect(mapStateToProps, { hideSubjects, showSubjects })(memo(SubjectGroupList));

SubjectGroupList.defaultProps = {
  map: {},
};

SubjectGroupList.propTypes = {
  map: PropTypes.object,
};
