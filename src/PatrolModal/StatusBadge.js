import React, { memo, useMemo } from 'react';
import { withFormDataContext } from '../EditableItem/context';

import { ReactComponent as Chevron } from '../common/images/icons/triple-chevron.svg';
import { calcPatrolCardState } from '../utils/patrols';

import styles from './styles.module.scss';


const StatusBadge = (props) => {
  const { data:patrol } = props;
  const status = useMemo(() => calcPatrolCardState(patrol), [patrol]);

  return <span className={styles.statusBadge}><Chevron /> {status.title}</span>;
};

export default memo(withFormDataContext(StatusBadge));