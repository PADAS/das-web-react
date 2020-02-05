import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import TimeAgo from '../TimeAgo';
import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle } from '../utils/datetime';

import styles from './styles.module.scss';

export default class DateTime extends PureComponent {
  render() {
    const { date, showElapsed, className, ...rest } = this.props;
    return <div className={`${styles.container} ${className || ''}`} title={generateCurrentTimeZoneTitle()} {...rest}>
      <span className={styles.date}>{format(new Date(date), STANDARD_DATE_FORMAT)}</span>
      {showElapsed && <TimeAgo className={styles.elapsed} date={date} />}
    </div>;
  }
}

DateTime.defaultProps = {
  showElapsed: true,
};

DateTime.propTypes = {
  date: PropTypes.string.isRequired,
  showElapsed: PropTypes.bool,
};