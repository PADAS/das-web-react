import React, { useState } from 'react';
import setHours from 'date-fns/set_hours';
import startOfDay from 'date-fns/start_of_day';
import subDays from 'date-fns/sub_days';
import { useTranslation } from 'react-i18next';

import { KML_EXPORT_CATEGORY, REPORT_EXPORT_CATEGORY, trackEventFactory } from '../utils/analytics';

import DataExportModal from '../DataExportModal';
import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';

const kmlExportTracker = trackEventFactory(KML_EXPORT_CATEGORY);
const reportExportTracker = trackEventFactory(REPORT_EXPORT_CATEGORY);

const KMLExportModal = (props) => {
  const { t } = useTranslation('menu-drawer', { keyPrefix: 'kmlExportModal' });

  const today = setHours(startOfDay(new Date()), 18);

  const [customEndDate, setEndDate] = useState(setHours(today, 18));
  const [customStartDate, setStartDate] = useState(subDays(today, 14));
  const [includeInactive, setIncludeInactive] = useState(false);

  const onCheckboxChange = () => {
    setIncludeInactive(!includeInactive);

    kmlExportTracker.track(`${includeInactive}? 'Uncheck' : 'Check'} 'Show Inactive' checkbox`);
  };

  const handleStartDateChange = value => {
    setStartDate(value);

    reportExportTracker.track('Set KML Start Date');
  };

  const handleEndDateChange = value => {
    setEndDate(value);

    reportExportTracker.track('Set KML End Date');
  };

  return <DataExportModal
      {...props}
      params={{ end: customEndDate, start: customStartDate, include_inactive: includeInactive }}
      title={t('dataExportModalTitle')}
    >
    <div>
      <DateRangeSelector
        className={styles.controls}
        endDate={customEndDate}
        maxDate={today}
        onEndDateChange={handleEndDateChange}
        onStartDateChange={handleStartDateChange}
        placement="bottom"
        popoverClassName={styles.datePopover}
        requireEnd={true}
        requireStart={true}
        startDate={customStartDate}
      />
    </div>

    <div className={styles.inactiveSubjects}>
      <label>
        <input checked={includeInactive} onChange={onCheckboxChange} type="checkbox" />

        <span className={styles.checkboxLabel}>{t('includeInactiveSubjectsLabel')}</span>
      </label>
    </div>
  </DataExportModal >;
};

export default KMLExportModal;
