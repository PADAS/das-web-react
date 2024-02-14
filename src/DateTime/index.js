import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import TimeAgo from '../TimeAgo';
import { STANDARD_DATE_FORMAT, generateCurrentTimeZoneTitle, format } from '../utils/datetime';
import { DATE_LOCALES } from '../constants';

import styles from './styles.module.scss';

const DateTime = ({ date, showElapsed, className, ...rest }) => {
  const { i18n: { language } } = useTranslation('dates');
  const dateLocale = DATE_LOCALES[language];

  if (!date){
    return null;
  }

  return <div className={`${styles.container} ${className}`} title={generateCurrentTimeZoneTitle()} {...rest}>
    <span className={styles.date}>
      {
        format(new Date(date), STANDARD_DATE_FORMAT, {
          locale: dateLocale
        })
      }
    </span>
    {showElapsed && <TimeAgo className={styles.elapsed} date={date} {...rest} />}
  </div>;
};

DateTime.defaultProps = {
  showElapsed: true,
  className: ''
};

DateTime.propTypes = {
  className: PropTypes.string,
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  showElapsed: PropTypes.bool,
};

export default DateTime;
