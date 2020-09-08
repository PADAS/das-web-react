import React, { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import distanceInWords from 'date-fns/distance_in_words';

const calculateTimeElapsed = (since) => {
  const now = new Date();

  if (now.getTime() < since.getTime()) return null;
  return distanceInWords(since, now);
};

const TimeElapsed = (props) => {
  const { date, className = '' } = props;
  const [value, setValue] = useState(calculateTimeElapsed(date));

  const interval = useRef(null);

  useEffect(() => {
    interval.current = window.setInterval(() => {
      setValue(calculateTimeElapsed(date));
    }, 1000);
    return () => {
      window.clearInterval(interval.current);
    };
  }, []); /* eslint-disable-line */

  return <span className={className}>{value}</span>;
};

export default memo(TimeElapsed);

TimeElapsed.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
};