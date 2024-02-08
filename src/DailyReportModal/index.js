import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import {
  setHours,
  startOfDay,
  subDays
} from 'date-fns';
import { useTranslation } from 'react-i18next';

import { REPORT_EXPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import DataExportModal from '../DataExportModal';
import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';

const reportExportTracker = trackEventFactory(REPORT_EXPORT_CATEGORY);

const DailyReportModal = (props) => {
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'dailyReportModal' });

  const today = setHours(startOfDay(new Date()), 18);
  const yesterday = subDays(today, 1);

  const [customEndDate, setEndDate] = useState(setHours(today, 18));
  const [customStartDate, setStartDate] = useState(subDays(today, 1));

  const setParamsForYesterday = () => {
    setStartDate(subDays(yesterday, 1));
    setEndDate(yesterday);

    reportExportTracker.track('Click \'Yesterday\'s Report\' button', null);
  };

  const setParamsForToday = () => {
    setStartDate(yesterday);
    setEndDate(today);

    reportExportTracker.track('Click \'Today\'s Report\' button', null);
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);

    reportExportTracker.track('Set Report Start Date');
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);

    reportExportTracker.track('Set Report End Date');
  };

  return <DataExportModal
      {...props}
      params={{ before: customEndDate, since: customStartDate }}
      title={t('dataExportModalTitle')}
      url="reports/sitrep.docx"
    >
    <div className={styles.controls}>
      <Button onClick={setParamsForYesterday} type="button">{t('yesterdaysReportButton')}</Button>

      <Button onClick={setParamsForToday} type="button">{t('todaysReportButton')}</Button>
    </div>

    <DateRangeSelector
      className={styles.controls}
      endDate={customEndDate}
      gaEventSrc="Report Export"
      maxDate={today}
      onEndDateChange={handleEndDateChange}
      onStartDateChange={handleStartDateChange}
      placement="bottom"
      popoverClassName={styles.popovers}
      requireEnd
      requireStart
      startDate={customStartDate}
    />
  </DataExportModal >;
};

export default DailyReportModal;
