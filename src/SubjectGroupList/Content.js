import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';

import CheckableList from '../CheckableList';
import SubjectListItem from './SubjectListItem';
import HeatmapToggleButton from '../HeatmapToggleButton';
import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects, getHeatmapEligibleSubjectsFromGroups } from '../utils/subjects';

import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const mapStateToProps = ({ view: { hiddenSubjectIDs, heatmapSubjectIDs } }) => ({ hiddenSubjectIDs, heatmapSubjectIDs });

const ContentComponent = connect(mapStateToProps, { hideSubjects, showSubjects })(memo((props) => {
  const { subgroups, subjects, name, hiddenSubjectIDs, heatmapSubjectIDs, hideSubjects, showSubjects, map, ...rest } = props;

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
  };

  const groupIsFullyHeatmapped = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => heatmapSubjectIDs.includes(id));
  const groupIsPartiallyHeatmapped = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyHeatmapped(group, hiddenSubjectIDs) && groupSubjectIDs.some(id => heatmapSubjectIDs.includes(id));
  };

  const subjectIsVisible = subject => !hiddenSubjectIDs.includes(subject.id);

  const onGroupCheckClick = (group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);

    if (groupIsFullyVisible(group)) return hideSubjects(...subjectIDs);
  
    return showSubjects(...subjectIDs);
  };

  const onSubjectCheckClick = (subject) => {
    if (subjectIsVisible(subject)) return hideSubjects(subject.id);

    return showSubjects(subject.id);
  };
  
  const onGroupHeatmapToggle = group => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);
  };

  const canShowHeatmapControlForGroup = group => !!getHeatmapEligibleSubjectsFromGroups().length;

  
  if (!subgroups.length && !subjects.length) return null;
  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={<h2>{name}</h2>}
    triggerSibling={() => <div>
     {canShowHeatmapControlForGroup(props) && <HeatmapToggleButton />}
    </div>
    }>
    {!!subgroups.length &&
      <CheckableList
        className={styles.list}
        items={subgroups}
        itemProps={{ map }}
        itemFullyChecked={groupIsFullyVisible}
        itemPartiallyChecked={groupIsPartiallyVisible}
        onCheckClick={onGroupCheckClick}
        itemComponent={ContentComponent} />
    }
    {!!subjects.length &&
      <CheckableList
        className={styles.list}
        items={subjects}
        itemProps={{ map }}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>
}));

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