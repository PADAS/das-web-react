import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';

import CheckableList from '../CheckableList';
import SubjectListItem from './SubjectListItem';
import Controls from './Controls';
import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects } from '../utils/subjects';

import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const mapStateToProps = ({ view: { hiddenSubjectIDs } }) => ({ hiddenSubjectIDs });

const ContentComponent = connect(mapStateToProps, { hideSubjects, showSubjects })(memo((props) => {
  const { subgroups, subjects, name, hiddenSubjectIDs, hideSubjects, showSubjects } = props;

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
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
  
  
  if (!subgroups.length && !subjects.length) return null;
  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={<h2>{name}</h2>}
    triggerSibling={() =>
    <Controls />
    }>
    {!!subgroups.length &&
      <CheckableList
        className={styles.list}
        items={subgroups}
        itemFullyChecked={groupIsFullyVisible}
        itemPartiallyChecked={groupIsPartiallyVisible}
        onCheckClick={onGroupCheckClick}
        itemComponent={ContentComponent} />
    }
    {!!subjects.length &&
      <CheckableList
        className={styles.list}
        items={subjects}
        itemFullyChecked={subjectIsVisible}
        onCheckClick={onSubjectCheckClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>
}));

export default ContentComponent;

ContentComponent.propTypes = {
  subgroups: PropTypes.array.isRequired,
  subjects: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  hiddenSubjectIDs: PropTypes.array,
}