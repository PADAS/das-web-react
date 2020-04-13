import React, { memo } from 'react';
import { connect } from 'react-redux';
import { calcFriendlyDurationString } from '../utils/datetime';

const mapStateToProps = ({ data: { eventFilter } }, { view: timeSliderState }) => ({ eventFilter, timeSliderState });

const CurrentFilterSelectionString = (props) => {
  const { eventFilter, className, timeSliderState } = props;
  const { filter: { date_range  } } = eventFilter;

  const prefixText = (!!timeSliderState && timeSliderState.active) ? 'Show reports and locations from' : 'Show reports from';

  return <span className={className || ''}>{prefixText} <strong>{calcFriendlyDurationString(date_range.lower, date_range.upper)}</strong></span>;
};

export default connect(mapStateToProps, null)(memo(CurrentFilterSelectionString));