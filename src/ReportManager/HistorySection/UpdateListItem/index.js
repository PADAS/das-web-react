import React, { memo } from 'react';
import PropTypes from 'prop-types';

import DateTime from '../../../DateTime';

import styles from './styles.module.scss';

const UpdateListItem = ({ message, time, user }) => <li className={styles.historyListItem}>
  <div>
    {user.first_name && <p className={styles.user}>
      {`${user.first_name} ${user.last_name ?? ''}`}
    </p>}
    <p className={styles.message}>{message}</p>
  </div>

  <DateTime className={styles.date} date={time} showElapsed={false} />
</li>;

UpdateListItem.propTypes = {
  message: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  user: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
  }).isRequired,
};

export default memo(UpdateListItem);
