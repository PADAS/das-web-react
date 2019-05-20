import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import { subDays, startOfDay, setHours } from 'date-fns';

import { hideModal } from '../ducks/modals';
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

  const setParamsForYesterday = () => setParamsFor('yesterday');
  const setParamsForToday = () => setParamsFor('today');

  const handleInputChange = (type, value) => {
    if (type === 'start') setStartDate(value);
    if (type === 'end') setEndDate(value);
  };

  const handleStartDateChange = value => handleInputChange('start', value);
  const handleEndDateChange = value => handleInputChange('end', value);

  const exportParams = {before: customEndDate, since: customStartDate};

  return <DataExportModal {...props} title='Daily Report' url='reports/sitrep.docx' params={exportParams}>
    <div className={styles.controls}>
      <Button type="button" onClick={setParamsForYesterday}>Yesterday's Report</Button>
      <Button type="button" onClick={setParamsForToday}>Today's Report</Button>
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
      />
    {/* <div className={styles.controls}>
      <label htmlFor="dailyReportStartDate">
        <span>From:</span>
        <DateTimePicker required maxDate={today} id="dailyReportStartDate" {...DATEPICKER_CONFIG} value={customStartDate} onChange={handleStartDateChange} />
      </label>
      <label htmlFor="dailyReportEndDate">
        <span>Until:</span>
        <DateTimePicker required minDate={customStartDate} maxDate={today} id="dailyReportEndDate" {...DATEPICKER_CONFIG} value={customEndDate} onChange={handleEndDateChange} />
      </label>
    </div> */}
  </DataExportModal >;
};

DailyReportModal.propTypes = {
  id: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
};

export default connect(null, { hideModal })(DailyReportModal);