import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { updateGlobalDateRange } from '../ducks/global-date-range';
import { trackEvent } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const EventFilterDateRangeSelector = (props) => {
  const { patrolFilter, updateGlobalDateRange, placement, filterSettings } = props;

  const { filter: { date_range:dateRange } } = patrolFilter;
  
  const afterClickPreset = useCallback((label) => {
    trackEvent('Patrol Filter', 'Select Date Range Preset', `Date Range: ${label}`);
  }, []);

  const afterEndChange = useCallback(() => {
    trackEvent('Patrol Filter', 'Change End Date Filter');
  }, []);

  const afterStartChange = useCallback(() => {
    trackEvent('Patrol Filter', 'Change Start Date Filter');
  }, []);

  return <FeedDateFilter 
    dateRange={dateRange}
    defaultFriendlyString='Showing Current Patrols'
    defaultRange={INITIAL_FILTER_STATE.filter.date_range}
    afterClickPreset={afterClickPreset}
    afterEndChange={afterEndChange}
    afterStartChange={afterStartChange}
    updateFilter={updateGlobalDateRange}
    placement={placement}
    requireEnd={true}
    endMaxDate={null}
    nullUpperOverride={INITIAL_FILTER_STATE.filter.date_range.upper}
    filterSettings={filterSettings}
  />;

};

const mapStatetoProps = ({ data: { patrolFilter } }) => ({ patrolFilter });


export default connect(mapStatetoProps, { updateGlobalDateRange })(memo(EventFilterDateRangeSelector));
