import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import TimeAgo from 'react-timeago'
import { STANDARD_DATE_FORMAT } from '../utils/datetime';

import styles from './styles.module.scss';

export default class DateTime extends PureComponent {
  render() {
    const { date, showElapsed, className, ...rest } = this.props;
    return (
      <div className={`${styles.container} ${className || ''}`} {...rest}>
        <h6 className={styles.date}>{format(new Date(date), STANDARD_DATE_FORMAT)}</h6>
        {showElapsed && <TimeAgo className={styles.elapsed} date={date} />}
      </div>
    )
  }
}

DateTime.defaultProps = {
  showElapsed: true,
};

DateTime.propTypes = {
  date: PropTypes.string.isRequired,
  showElapsed: PropTypes.bool,
};