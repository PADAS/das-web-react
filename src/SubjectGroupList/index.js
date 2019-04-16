import React, { Fragment, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import isEqual from 'lodash/isEqual';

import { hideSubjects, showSubjects } from '../ducks/map-ui';
import CheckableList from '../CheckableList';
import SubjectListItem from './listItem';

import styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: true,
  transitionTime: 1,
};

const groupIsChecked = (item) => true;

const onGroupClick = item => console.log('group click', item);
const onSubjectClick = item => console.log('subject click', item);

const ControlsComponent = (props) => {

};

const ContentComponent = memo((props) => {
  const { subgroups, subjects, name } = props;
  if (!subgroups.length && !subjects.length) return null;
  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    trigger={<h2>{name}</h2>}
    triggerSibling={() =>
    <div className={styles.controls}>
      {/* controls go here */}
    </div>
    }>
    {!!subgroups.length &&
      <CheckableList
        className={styles.list}
        items={subgroups}
        itemFullyChecked={groupIsChecked}
        itemPartiallyChecked={groupIsChecked}
        onCheckClick={onGroupClick}
        itemComponent={ContentComponent} />
    }
    {!!subjects.length &&
      <CheckableList
        className={styles.list}
        items={subjects}
        itemFullyChecked={subject => true}
        itemPartiallyChecked={subject => true}
        onCheckClick={onSubjectClick}
        itemComponent={SubjectListItem} />
    }
  </Collapsible>
});

const SubjectGroupList = memo((props) => {
  const { subjectGroups, hideSubjects, showSubjects } = props;
  return <CheckableList
    className={styles.list}
    id='subjectgroups'
    onCheckClick={onGroupClick}
    itemComponent={ContentComponent}
    items={subjectGroups}
    itemFullyChecked={groupIsChecked}
    itemPartiallyChecked={groupIsChecked} />
}, (prev, current) =>
    isEqual(prev.hiddenSubjectIDs, current.hiddenSubjectIDs) && isEqual(prev.subjectGroups, current.subjectGroups)
);


connect(null, { hideSubjects, showSubjects })(ControlsComponent);


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