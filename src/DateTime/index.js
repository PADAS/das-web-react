import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import TimeAgo from '../TimeAgo';
import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle } from '../utils/datetime';

import styles from './styles.module.scss';

const { UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

export default class DateTime extends PureComponent {
  render() {
    const { date, showElapsed, className, ...rest } = this.props;
    return <div className={`${styles.container} ${className || ''}`} title={generateCurrentTimeZoneTitle()} {...rest}>
      <span className={UFA_NAVIGATION_UI ? styles.date : styles.oldNavigationDate}>{format(new Date(date), STANDARD_DATE_FORMAT)}</span>
      {showElapsed && <TimeAgo className={UFA_NAVIGATION_UI ? styles.elapsed : styles.oldNavigationElapsed} date={date} {...rest} />}
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