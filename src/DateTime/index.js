import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import TimeAgo from 'react-timeago'

export default class DisplayTime extends PureComponent {
  render() {
    const { date, showElapsed, ...rest } = this.props;
    return (
      <div {...rest}>
        <h6>{format(new Date(date), 'D MMM YYYY hh:mm')}</h6>
        {showElapsed && <TimeAgo date={date} />}
      </div>
    )
  }
}

DisplayTime.defaultProps = {
  showElapsed: true,
};

DisplayTime.propTypes = {
  date: PropTypes.string.isRequired,
  showElapsed: PropTypes.bool,
};