import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CancelToken } from 'axios';
import DateTimePicker from 'react-datetime-picker';
import { Button } from 'react-bootstrap';
import { subDays, startOfToday, setHours } from 'date-fns';

import { hideModal } from '../ducks/modals';
import DataExportModal from '../DataExportModal';

import styles from './styles.module.scss';

const DATEPICKER_CONFIG = {
  disableClock: true,
  format: 'dd-MM-yy HH:mm',
};


const DailyReportModal = (props) => {
  const today = setHours(startOfToday(), 18);
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

  const handleInputChange = (type, value) => {
    if (type === 'start') setStartDate(value);
    if (type === 'end') setEndDate(value);
  };

  return <DataExportModal {...props} title='Daily Report' url='reports/sitrep.docx' params={{before: customEndDate, since: customStartDate} }>
    <div className={styles.controls}>
      <Button type="button" onClick={() => setParamsFor('yesterday')}>Yesterday's Report</Button>
      <Button type="button" onClick={() => setParamsFor('today')}>Today's Report</Button>
    </div>
    <div className={styles.controls}>
      <label htmlFor="dailyReportStartDate">
        <span>Since:</span>
        <DateTimePicker required maxDate={today} id="dailyReportStartDate" {...DATEPICKER_CONFIG} value={customStartDate} onChange={value => handleInputChange('start', value)} />
      </label>
      <label htmlFor="dailyReportEndDate">
        <span>Before:</span>
        <DateTimePicker required minDate={customStartDate} maxDate={today} id="dailyReportEndDate" {...DATEPICKER_CONFIG} value={customEndDate} onChange={value => handleInputChange('end', value)} />
      </label>
    </div>
  </DataExportModal >;
};

DailyReportModal.propTypes = {
  id: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
};

export default connect(null, { hideModal })(DailyReportModal);