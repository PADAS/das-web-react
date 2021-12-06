import React, { useState } from 'react';
import { trackEventFactory, KML_EXPORT_CATEGORY, REPORT_EXPORT_CATEGORY } from '../utils/analytics';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';
import setHours from 'date-fns/set_hours';

import { removeModal } from '../ducks/modals';
import DataExportModal from '../DataExportModal';
import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';

const kmlExportTracker = trackEventFactory(KML_EXPORT_CATEGORY);
const reportExportTracker = trackEventFactory(REPORT_EXPORT_CATEGORY);

const KMLExportModal = (props) => {

  const [includeInactive, setIncludeInactive] = useState(false);

  const today = setHours(startOfDay(new Date()), 18);

  const [customEndDate, setEndDate] = useState(setHours(today, 18));
  const [customStartDate, setStartDate] = useState(subDays(today, 14));

  const handleInputChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
    };
    if (type === 'end') {
      setEndDate(value);
    }
  };

  const onCheckboxChange = () => {
    setIncludeInactive(!includeInactive);
    kmlExportTracker.track(`${includeInactive}? 'Uncheck' : 'Check'} 'Show Inactive' checkbox`);
  };

  const handleStartDateChange = value => {
    reportExportTracker.track('Set KML Start Date');
    handleInputChange('start', value);
  };
  const handleEndDateChange = value => {
    reportExportTracker.track('Set KML End Date');
    handleInputChange('end', value);
  };

  const exportParams = { end: customEndDate, start: customStartDate, include_inactive: includeInactive };

  return <DataExportModal {...props} title='Export Master KML File' params={exportParams}>
    <div>
      <DateRangeSelector
        className={styles.controls}
        popoverClassName={styles.datePopover}
        maxDate={today}
        startDate={customStartDate}
        endDate={customEndDate}
        requireStart={true}
        requireEnd={true}
        placement='bottom'
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />
    </div>
    <div className={styles.inactiveSubjects}>
      <label>
        <input type='checkbox' checked={includeInactive} onChange={onCheckboxChange} />
        <span className={styles.checkboxLabel}>Include inactive subjects</span>
      </label>
    </div>
  </DataExportModal >;
};

KMLExportModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
};

export default connect(null, { removeModal })(KMLExportModal);
