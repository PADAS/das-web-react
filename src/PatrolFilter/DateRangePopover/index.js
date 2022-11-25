import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { PATROL_FILTER_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { resetGlobalDateRange } from '../../ducks/global-date-range';

import PatrolFilterDateRangeSelector from '../DateRange';
import PatrolFilterSettings from '../PatrolFilterSettings';

import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PATROL_FILTER_BY_DATE_RANGE_OVERLAP = 'overlap_dates';

const DateRangePopover = React.forwardRef(({ containerRef, ...rest }, ref) => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);

  const onFilterSettingsOptionChange = useCallback((event) => {
    const patrolOverlap = event.currentTarget.value === PATROL_FILTER_BY_DATE_RANGE_OVERLAP;

    dispatch(updatePatrolFilter({ filter: { patrols_overlap_daterange: patrolOverlap } }));

    patrolFilterTracker.track(patrolOverlap ? 'Filter by date range overlap' : 'Filter by start date');
  }, [dispatch]);

  const resetDateRange = useCallback((event) => {
    event.stopPropagation();

    dispatch(resetGlobalDateRange());

    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [dispatch]);

  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  return <Popover {...rest} ref={ref} className={styles.filterPopover} id='filter-date-popover'>
    <Popover.Header>
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
    </Popover.Header>

    <Popover.Body style={{ overflow: 'visible' }}>
      <PatrolFilterDateRangeSelector
        placement='bottom'
        onFilterSettingsToggle={() => patrolFilterTracker.track('Click Date Filter Settings button')}
        endDateLabel=''
        startDateLabel=''
        container={containerRef}
        filterSettings={<PatrolFilterSettings handleFilterOptionChange={onFilterSettingsOptionChange} />}
      />
    </Popover.Body>
  </Popover>;
});

DateRangePopover.propTypes = { containerRef: PropTypes.any };

DateRangePopover.displayName = 'DateRangePopover';

export default memo(DateRangePopover);
