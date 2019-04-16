import React, { Fragment, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import CheckableList from '../CheckableList';
import SubjectListItem from './listItem';

import styles from './styles.module.scss';


const groupIsChecked = (item) => true;

const onGroupClick = item => console.log('group click', item);
const onSubjectClick = item => console.log('subject click', item);

const renderFunction = (props) => {
  const { subgroups, subjects, name } = props;
  return <Fragment>
    <h2>{name}</h2>
    {!!subgroups.length && <CheckableList
      className={styles.list}
      items={subgroups}
      itemIsChecked={groupIsChecked}
      onCheckClick={onGroupClick}
      itemRenderFunc={renderFunction} />}
    {!!subjects.length && <CheckableList
      className={styles.list}
      items={subjects}
      itemIsChecked={subject => true}
      onCheckClick={onSubjectClick}
      itemComponent={SubjectListItem} />}
  </Fragment>
};

const SubjectGroupList = memo((props) => {
  const { subjectGroups, hiddenSubjectIDs, ...rest } = props;
  return <CheckableList
    className={styles.list}
    id='subjectgroups'
    onCheckClick={onGroupClick}
    itemRenderFunc={renderFunction}
    items={subjectGroups}
    itemIsChecked={groupIsChecked} />
});




const mapStateToProps = ({ data: { subjectGroups }, view: { hiddenSubjectIDs } }) => ({ subjectGroups, hiddenSubjectIDs });

export default connect(mapStateToProps, null)(SubjectGroupList);

SubjectGroupList.defaultProps = {
  onCheckClick: item => console.log('clicky', item),
  subjectIsChecked: () => true,
}

SubjectGroupList.propTypes = {
  subjectGroups: PropTypes.array.isRequired,
  hiddenSubjectIDs: PropTypes.array.isRequired,
  onCheckClick: PropTypes.func,
  subjectIsChecked: PropTypes.func,
};