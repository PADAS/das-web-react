import React from 'react';
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../../utils/analytics';

import PatrolFilterDateRangeSelector from '../DateRange';
import PatrolFilterSettings from '../PatrolFilterSettings';
import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';

import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const DateRangePopover = React.forwardRef(({
  containerRef,
  onFilterSettingsOptionChange,
  resetButtonDisabled,
  resetDateRange,
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
          onClick={resetDateRange}
          disabled={resetButtonDisabled}
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
));

DateRangePopover.propTypes = {
  resetButtonDisabled: true,
  resetDateRange: null,
};

DateRangePopover.propTypes = {
  containerRef: PropTypes.any,
  onFilterSettingsOptionChange: PropTypes.func.isRequired,
  resetButtonDisabled: PropTypes.bool,
  resetDateRange: PropTypes.func,
};

DateRangePopover.displayName = 'DateRangePopover';

export default DateRangePopover;
