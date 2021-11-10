import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { updateGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const EventFilterDateRangeSelector = (props) => {
  const { patrolFilter, onFilterSettingsToggle, updateGlobalDateRange, placement, filterSettings } = props;

  const { filter: { date_range: dateRange } } = patrolFilter;

  const afterClickPreset = useCallback((label) => {
    patrolFilterTracker.track('Select Date Range Preset', `Date Range: ${label}`);
  }, []);

  const afterEndChange = useCallback(() => {
    patrolFilterTracker.track('Change End Date Filter');
  }, []);

  const afterStartChange = useCallback(() => {
    patrolFilterTracker.track('Change Start Date Filter');
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
    onFilterSettingsToggle={onFilterSettingsToggle}
    nullUpperOverride={INITIAL_FILTER_STATE.filter.date_range.upper}
    filterSettings={filterSettings}
  />;

};

const mapStatetoProps = ({ data: { patrolFilter } }) => ({ patrolFilter });


export default connect(mapStatetoProps, { updateGlobalDateRange })(memo(EventFilterDateRangeSelector));
