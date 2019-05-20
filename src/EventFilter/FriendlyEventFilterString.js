import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';

import { calcFriendlyEventStateFilterString, calcFriendlyEventTypeFilterString } from '../utils/events';
import { calcFriendlyDurationString } from '../utils/datetime';

const mapStateToProps = ({ data: { eventTypes, eventFilter } }) => ({ eventFilter, eventTypes });


const FriendlyEventFilterString = memo((props) => {
  const { eventFilter, eventTypes, className } = props;
  const { filter: { text, date_range } } = eventFilter;

  return <span className={className || ''}>
    Showing <strong style={{textTransform: 'lowercase'}}>{calcFriendlyEventStateFilterString(eventFilter)}</strong> reports{text && <Fragment>, filtered by <strong>"{text}"</strong>,</Fragment>} for <strong>{calcFriendlyEventTypeFilterString(eventTypes, eventFilter)}</strong> from <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong>
  </span>;
});

export default connect(mapStateToProps, null)(FriendlyEventFilterString);