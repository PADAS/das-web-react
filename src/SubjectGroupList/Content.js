import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';
import isEqual from 'lodash/isEqual';

import CheckableList from '../CheckableList';
import SubjectListItem from './SubjectListItem';
import { getUniqueSubjectGroupSubjects, getHeatmapEligibleSubjectsFromGroups } from '../utils/subjects';

import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const ContentComponent = memo((props) => {
  const { subgroups, subjects, name, map, onGroupCheckClick, onSubjectCheckClick, hiddenSubjectIDs, subjectIsVisible, ...rest } = props;

  const nonEmptySubgroups = subgroups.filter(g => !!g.subgroups.length || !!g.subjects.length);

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
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


  const onGroupHeatmapToggle = group => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
  };

  const canShowHeatmapControlForGroup = group => !!getHeatmapEligibleSubjectsFromGroups(group).length;

  if (!name) return null;
  if (!subgroups.length && !subjects.length) return null;

  const trigger = <h2>{name}</h2>;
  const triggerSibling = () => <div>
    {/* {canShowHeatmapControlForGroup(props) && <HeatmapToggleButton />} */}
  </div>;

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={trigger}
    triggerSibling={triggerSibling}>
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
        className={styles.list}
        items={subjects}
        itemProps={subjectItemProps}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>
}, (prev, current) => {
 if (isEqual(prev.hiddenSubjectIDs, current.hiddenSubjectIDs)) return true;

 const currentSubjectIDs = getUniqueSubjectGroupSubjects(current).map(s => s.id);

 if (currentSubjectIDs.some(id => prev.hiddenSubjectIDs.includes(id))
  === currentSubjectIDs.some(id => current.hiddenSubjectIDs.includes(id))) return true;
 return false;
});

export default ContentComponent;


ContentComponent.defaultProps = {
  itemProps: {},
};

ContentComponent.propTypes = {
  subgroups: PropTypes.array.isRequired,
  itemProps: PropTypes.object,
  subjects: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  hiddenSubjectIDs: PropTypes.array,
  heatmapSubjectIDs: PropTypes.array,
}

