import React, { memo } from 'react';
import { withFormDataContext } from '../EditableItem/context';

import { ReactComponent as Chevron } from '../common/images/icons/triple-chevron.svg';
import { calcPatrolState } from '../utils/patrols';

import styles from './styles.module.scss';

const StatusBadge = (props) => {
  const { data } = props;
  const status = calcPatrolState(data)?.title;

  return status && <span className={styles.statusBadge}><Chevron /> {status}</span>;
};

export default memo(withFormDataContext(StatusBadge));