import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';

import { updatePatrolFilter } from '../ducks/patrol-filter';
import { trackEvent } from '../utils/analytics';

import FeedDateFilter from '../FeedDateFilter';

const EventFilterDateRangeSelector = (props) => {
  const { patrolFilter, updateFilter } = props;
  
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
    updateFilter={updateFilter}
  />;

};

const mapStatetoProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

const mapDispatchToProps = dispatch => ({
  updateFilter: filter => dispatch(updatePatrolFilter(filter)),
});

export default connect(mapStatetoProps, mapDispatchToProps)(memo(EventFilterDateRangeSelector));
