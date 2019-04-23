import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import isEqual from 'lodash/isEqual';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import { getUniqueSubjectGroupSubjects } from '../utils/subjects';
import CheckableList from '../CheckableList';

import Content from './Content';
import styles from './styles.module.scss';


const SubjectGroupList = memo((props) => {
  const { subjectGroups, hideSubjects, showSubjects, hiddenSubjectIDs, map } = props;

  const groupIsFullyVisible = group => !getUniqueSubjectGroupSubjects(group).map(item => item.id).some(id => hiddenSubjectIDs.includes(id));
  const groupIsPartiallyVisible = (group) => {
    const groupSubjectIDs = getUniqueSubjectGroupSubjects(group).map(item => item.id);
    return !groupIsFullyVisible(group, hiddenSubjectIDs) && !groupSubjectIDs.every(id => hiddenSubjectIDs.includes(id));
  };

  const onCheckClick = (group) => {
    const subjectIDs = getUniqueSubjectGroupSubjects(group).map(s => s.id);

    if (groupIsFullyVisible(group)) return hideSubjects(...subjectIDs);
    return showSubjects(...subjectIDs);
  };
  
  return <CheckableList
    className={styles.list}
    id='subjectgroups'
    onCheckClick={onCheckClick}
    itemComponent={Content}
    itemProps={{ map }}
    items={subjectGroups}
    itemFullyChecked={groupIsFullyVisible}
    itemPartiallyChecked={groupIsPartiallyVisible} />
}, (prev, current) =>
    isEqual(prev.map && current.map) && isEqual(prev.hiddenSubjectIDs, current.hiddenSubjectIDs) && isEqual(prev.subjectGroups, current.subjectGroups)
);

const mapStateToProps = ({ data: { subjectGroups }, view: { hiddenSubjectIDs } }) => ({ subjectGroups, hiddenSubjectIDs });
export default connect(mapStateToProps, { hideSubjects, showSubjects })(SubjectGroupList);

SubjectGroupList.defaultProps = {
  map: {},
};

SubjectGroupList.propTypes = {
  map: PropTypes.object,
};