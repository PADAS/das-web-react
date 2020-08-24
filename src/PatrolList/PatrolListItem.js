import React, { memo } from 'react';
import { connect } from 'react-redux';
import styles from 'styles.module.scss';

const PatrolListItem = (props) => {
  const { patrol, onPatrolClick, className, key, ...rest } = props;

  return <span className={styles.patrolItem} >
    {patrol.name}
  </span>;
};

export default connect(null, { showPatrol })(PatrolListItem);