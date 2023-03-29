import React, { memo } from 'react';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';
import EventFilterDateRangeSelector from '../DateRange';
import styles from '../styles.module.scss';

const DateFilter = ({ onClearDateRange, isDateRangeModified }) => (
  <>
    <Popover.Header>
      <div className={styles.popoverTitle}>
        <ClockIcon />Date Range
        <Button type="button" variant='light' size='sm' onClick={onClearDateRange} disabled={!isDateRangeModified}>Reset</Button>
      </div>
    </Popover.Header>
    <Popover.Body style={{ overflow: 'visible' }}>
      <EventFilterDateRangeSelector placement='bottom' endDateLabel='' startDateLabel=''/>
    </Popover.Body>
  </>
);

DateFilter.propTypes = {
  onClearDateRange: PropTypes.func.isRequired,
  isDateRangeModified: PropTypes.bool.isRequired
};

export default memo(DateFilter);
