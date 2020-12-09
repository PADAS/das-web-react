import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { updateEventFilter } from '../ducks/event-filter';
import { trackEvent } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const EventFilterDateRangeSelector = (props) => {
  const { eventFilter, updateFilter } = props;
  
  const afterClickPreset = useCallback((label) => {
    trackEvent('Event Filter', 'Select Date Range Preset', `Date Range: ${label}`);
  }, []);

  const afterEndChange = useCallback(() => {
    trackEvent('Event Filter', 'Change End Date Filter');
  }, []);

  const afterStartChange = useCallback(() => {
    trackEvent('Event Filter', 'Change Start Date Filter');
  }, []);

  return <FeedDateFilter 
    filterData={eventFilter}
    afterClickPreset={afterClickPreset}
    afterEndChange={afterEndChange}
    afterStartChange={afterStartChange}
    updateFilter={updateFilter}
  />;

};

const mapStatetoProps = ({ data: { eventFilter } }) => ({ eventFilter });

const mapDispatchToProps = dispatch => ({
  updateFilter: filter => dispatch(updateEventFilter(filter)),
});

export default connect(mapStatetoProps, mapDispatchToProps)(memo(EventFilterDateRangeSelector));
