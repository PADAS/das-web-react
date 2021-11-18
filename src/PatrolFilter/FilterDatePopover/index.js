import React from 'react';
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';

import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../../utils/analytics';

import PatrolFilterDateRangeSelector from '../../PatrolFilter/DateRange';
import PatrolFilterSettings from '../../PatrolFilter/PatrolFilterSettings';
import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';

import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const FilterDatePopover = ({
  clearDateRange,
  containerRef,
  dateRangeModified,
  onFilterSettingsOptionChange,
  ...rest
}, ref) => (
  <Popover {...rest} ref={ref} className={styles.filterPopover} id='filter-date-popover'>
    <Popover.Title>
      <div className={styles.popoverTitle}>
        <ClockIcon />
        Date Range
        <Button
          type="button"
          variant='light'
          size='sm'
          onClick={clearDateRange}
          disabled={!dateRangeModified}
        >
          Reset
        </Button>
      </div>
    </Popover.Title>

    <Popover.Content>
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

export default React.forwardRef(FilterDatePopover);
