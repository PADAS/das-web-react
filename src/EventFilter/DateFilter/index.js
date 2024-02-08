import React, { memo } from 'react';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClockIcon } from '../../common/images/icons/clock-icon.svg';
import EventFilterDateRangeSelector from '../DateRange';
import styles from '../styles.module.scss';

const DateFilter = ({ onClearDateRange, isDateRangeModified }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'dateFilter' });

  return <>
    <Popover.Header>
      <div className={styles.popoverTitle}>
        <ClockIcon title={t('title')} />
        {t('title')}
        <Button type="button" variant='light' size='sm' onClick={onClearDateRange} disabled={!isDateRangeModified}>
          {t('resetButton')}
        </Button>
      </div>
    </Popover.Header>
    <Popover.Body style={{ overflow: 'visible' }}>
      <EventFilterDateRangeSelector placement='bottom' endDateLabel='' startDateLabel=''/>
    </Popover.Body>
  </>;
};

DateFilter.propTypes = {
  onClearDateRange: PropTypes.func.isRequired,
  isDateRangeModified: PropTypes.bool.isRequired
};

export default memo(DateFilter);
