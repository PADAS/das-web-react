import React, { memo } from 'react';
import { connect } from 'react-redux';
import {capitalize} from '../utils/string';

const mapStateToProps = ({ data: { eventFilter } }, { view: timeSliderState }) => ({ eventFilter, timeSliderState });

const CurrentFilterSelectionString = (props) => {
  const { eventFilter, className } = props;
  const { filter: { current_selection } } = eventFilter;

  return <span className={className || ''}>{capitalize(current_selection)}</span>;
};

export default connect(mapStateToProps, null)(memo(CurrentFilterSelectionString));