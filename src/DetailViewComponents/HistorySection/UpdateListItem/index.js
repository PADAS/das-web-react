import React, { memo } from 'react';

import DateTime from '../../../DateTime';

import * as styles from './styles.module.scss';

const UpdateListItem = ({ message, time, user }) => <li className={styles.historyListItem}>
  <div>
    {user.first_name && <p className={styles.user}>
      {`${user.first_name} ${user.last_name ?? ''}`}
    </p>}
    <p className={styles.message}>{message}</p>
  </div>

  <DateTime className={styles.date} date={time} showElapsed={false} />
</li>;

export default memo(UpdateListItem);
