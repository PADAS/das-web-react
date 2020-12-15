import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { updatePatrolFilter, INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { trackEvent } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const EventFilterDateRangeSelector = (props) => {
  const { patrolFilter, updatePatrolFilter } = props;
  
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
    filterData={patrolFilter}
    afterClickPreset={afterClickPreset}
    afterEndChange={afterEndChange}
    afterStartChange={afterStartChange}
    updateFilter={updatePatrolFilter}
    requireEnd={true}
    endMaxDate={null}
    nullUpperOverride={INITIAL_FILTER_STATE.filter.date_range.upper}
  />;

};

const mapStatetoProps = ({ data: { patrolFilter } }) => ({ patrolFilter });


export default connect(mapStatetoProps, { updatePatrolFilter })(memo(EventFilterDateRangeSelector));
