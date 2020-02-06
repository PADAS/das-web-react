import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import subDays from 'date-fns/sub_days';
import startOfDay from 'date-fns/start_of_day';
import setHours from 'date-fns/set_hours';

import { trackEvent } from '../utils/analytics';
import { removeModal } from '../ducks/modals';
import DataExportModal from '../DataExportModal';
import DateRangeSelector from '../DateRangeSelector';

import styles from './styles.module.scss';

const DailyReportModal = (props) => {
  const today = setHours(startOfDay(new Date()), 18);
  const yesterday = subDays(today, 1);

  const [customEndDate, setEndDate] = useState(setHours(today, 18));
  const [customStartDate, setStartDate] = useState(subDays(today, 1));

  const setParamsFor = (type) => {
    if (type === 'today') {
      setStartDate(yesterday);
      setEndDate(today);
    }
    if (type === 'yesterday') {
      setStartDate(subDays(yesterday, 1));
      setEndDate(yesterday);
    }
  };

  const setParamsForYesterday = () => { 
    setParamsFor('yesterday');
    trackEvent('Report Export', 'Click \'Yesterday\'s Report\' button', null);
  };

  const setParamsForToday = () => { 
    setParamsFor('today');
    trackEvent('Report Export', 'Click \'Today\'s Report\' button', null);
  };

  const handleInputChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
    };
    if (type === 'end') {
      setEndDate(value);
    }
  };

  const handleStartDateChange = value => {
    trackEvent('Report Export', 'Set Report Start Date');
    handleInputChange('start', value);
  };
  const handleEndDateChange = value => {
    trackEvent('Report Export', 'Set Report End Date');
    handleInputChange('end', value);
  };

  const exportParams = {before: customEndDate, since: customStartDate};

  return <DataExportModal {...props} title='Daily Report' url='reports/sitrep.docx' params={exportParams}>
    <div className={styles.controls}>
      <Button type="button" onClick={setParamsForYesterday}>Yesterday&apos;s Report</Button>
      <Button type="button" onClick={setParamsForToday}>Today&apos;s Report</Button>
    </div>
    <DateRangeSelector
      className={styles.controls} 
      maxDate={today}
      startDate={customStartDate}
      endDate={customEndDate}
      requireStart={true}
      requireEnd={true}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      gaEventSrc='Report Export'
    />
  </DataExportModal >;
};

DailyReportModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
};

export default connect(null, { removeModal })(DailyReportModal);