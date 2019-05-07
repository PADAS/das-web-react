import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { updateEventFilter, resetEventFilter }from '../ducks/event-filter';
import DateRangeSelector from '../DateRangeSelector';

const EventFilter = (props) => {
  const { eventFilter, ...rest } = props;
  return <form {...rest}>
    
  </form>;
};

const mapStatetoProps = ({ data: { eventFilter } }) => ({ eventFilter })

export default connect(mapStatetoProps, null)(EventFilter);