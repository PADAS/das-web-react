import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { updateGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, EVENT_FILTER_CATEGORY } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const eventFilterTracker = trackEventFactory(EVENT_FILTER_CATEGORY);

const EventFilterDateRangeSelector = (props) => {
  const { eventFilter, updateGlobalDateRange, placement, popoverClassName } = props;

  const { filter: { date_range: dateRange } } = eventFilter;

  const afterClickPreset = useCallback((label) => {
    eventFilterTracker.track('Select Date Range Preset', `Date Range: ${label}`);
  }, []);

  const afterEndChange = useCallback(() => {
    eventFilterTracker.track('Change End Date Filter');
  }, []);

  const afterStartChange = useCallback(() => {
    eventFilterTracker.track('Change Start Date Filter');
  }, []);

  return <FeedDateFilter
    dateRange={dateRange}
    placement={placement}
    popoverClassName={popoverClassName}
    afterClickPreset={afterClickPreset}
    afterEndChange={afterEndChange}
    afterStartChange={afterStartChange}
    updateFilter={updateGlobalDateRange}
  />;

};

const mapStatetoProps = ({ data: { eventFilter } }) => ({ eventFilter });

export default connect(mapStatetoProps, { updateGlobalDateRange })(memo(EventFilterDateRangeSelector));
