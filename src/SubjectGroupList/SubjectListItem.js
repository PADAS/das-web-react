import React, { memo } from 'react';
import SubjectControls from '../SubjectControls';
import isEqual from 'react-fast-compare';

import styles from './styles.module.scss';

const SubjectListItem = memo((props) => {
  const { map, ...rest } = props;
  return <div>
    <h6 className={styles.subjectTitle}>{props.name}</h6>
    <SubjectControls className={styles.controls} map={map} showTitles={false} subject={rest} />
  </div>;
}, (prevProps, currentProps) => isEqual(prevProps, currentProps));

export default SubjectListItem;
