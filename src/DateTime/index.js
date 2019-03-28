import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import TimeAgo from 'react-timeago'

import styles from './styles.module.scss';

export default class DateTime extends PureComponent {
  render() {
    const { date, showElapsed, ...rest } = this.props;
    return (
      <div className={styles.container} {...rest}>
        <h6 className={styles.date}>{format(new Date(date), 'D MMM YYYY hh:mm')}</h6>
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