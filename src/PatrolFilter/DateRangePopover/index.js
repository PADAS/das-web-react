import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { resetGlobalDateRange } from '../../ducks/global-date-range';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../../utils/analytics';

import PatrolFilterDateRangeSelector from '../DateRange';
import PatrolFilterSettings from '../PatrolFilterSettings';
import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';

import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PATROL_FILTER_BY_DATE_RANGE_OVERLAP = 'overlap_dates';

const DateRangePopover = React.forwardRef(({
  containerRef,
  patrolFilter,
  resetGlobalDateRange,
  updatePatrolFilter,
  ...rest
}, ref) => {
  const onFilterSettingsOptionChange = useCallback((e) => {
    const patrolOverlap = e.currentTarget.value === PATROL_FILTER_BY_DATE_RANGE_OVERLAP;
    updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } });

    patrolFilterTracker.track(patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [updatePatrolFilter]);

  const resetDateRange = useCallback((e) => {
    e.stopPropagation();
    resetGlobalDateRange();

    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  return (
    <Popover {...rest} ref={ref} className={styles.filterPopover} id='filter-date-popover'>
      <Popover.Title>
        <div className={styles.popoverTitle}>
          <ClockIcon />
          Date Range
          <Button
            type="button"
            variant='light'
            size='sm'
            onClick={resetDateRange}
            disabled={!dateRangeModified}
          >
            Reset
          </Button>
        </div>
      </Popover.Title>

      <Popover.Content style={{ overflow: 'visible' }}>
        <PatrolFilterDateRangeSelector
          placement='bottom'
          onFilterSettingsToggle={() => patrolFilterTracker.track('Click Date Filter Settings button')}
          endDateLabel=''
          startDateLabel=''
          container={containerRef}
          filterSettings={<PatrolFilterSettings handleFilterOptionChange={onFilterSettingsOptionChange} />}
        />
      </Popover.Content>
    </Popover>
  );
});

DateRangePopover.propTypes = {
  containerRef: PropTypes.any,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({ date_range: PropTypes.object }),
  }).isRequired,
  resetGlobalDateRange: PropTypes.func.isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

DateRangePopover.displayName = 'DateRangePopover';

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
});

export default connect(
  mapStateToProps,
  { resetGlobalDateRange, updatePatrolFilter },
  null,
  { forwardRef: true }
)(memo(DateRangePopover));
