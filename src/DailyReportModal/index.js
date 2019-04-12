import React, { Fragment, memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CancelToken } from 'axios';
import DateTimePicker from 'react-datetime-picker';
import { Modal, Button, Form } from 'react-bootstrap';
import { subDays, startOfToday, setHours } from 'date-fns';


import { API_URL } from '../constants';
import { hideModal } from '../ducks/modals';
import { downloadFileFromUrl } from '../utils/download';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { Header, Title, Body, Footer } = Modal;
const { Control } = Form;
const DOWNLOAD_URL = `${API_URL}reports/sitrep.docx`;

const DATEPICKER_CONFIG = {
  disableClock: true,
  format: 'dd-MM-yy HH:mm',
};


const DailyReportModal = ({ id, hideModal }) => {
  const today = setHours(startOfToday(), 18);
  const yesterday = subDays(today, 1);

  const [customEndDate, setEndDate] = useState(setHours(today, 18));
  const [customStartDate, setStartDate] = useState(subDays(today, 1));
  const [downloading, setDownloadState] = useState(false);
  const [downloadCancelToken, setCancelToken] = useState(CancelToken.source());
  const [formIsValid, setValidationState] = useState(true);

  useEffect(() => {
    return () => {
      downloadCancelToken && downloadCancelToken.cancel();
      setDownloadState(false);
    }
  }, []);

  useEffect(() => {
    setValidationState(!!customStartDate && !!customEndDate);
  }, [customStartDate, customEndDate]);

  const triggerDownload = (before, since) => {
    setDownloadState(true);
    downloadFileFromUrl(DOWNLOAD_URL, { before, since }, downloadCancelToken)
    .finally(() => {
      setCancelToken(CancelToken.source());
      setDownloadState(false);
    })
    .then(() => {
      hideModal(id);
    });
  };

  const handleInputChange = (type, value) => {
    if (type === 'start') setStartDate(value);
    if (type === 'end') setEndDate(value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formIsValid) {
      triggerDownload(customEndDate, customStartDate)
    }
  };


  return <Fragment>
    {downloading && <LoadingOverlay />}
    <Header closeButton>
      <Title>Daily Report</Title>
    </Header>
    <Body className={downloading ? styles.downloading : ''}>
      <div className={styles.controls}>
        <Button onClick={() => triggerDownload(yesterday, subDays(yesterday, 1))}>Yesterday's Report</Button>
        <Button onClick={() => triggerDownload(today, yesterday)}>Today's Report</Button>
      </div>
      <Form className={styles.form} onSubmit={handleFormSubmit}>
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
        <Button disabled={!formIsValid} variant="primary" type="submit">Get Report</Button>
      </Form>
    </Body>
  </Fragment>
};

DailyReportModal.propTypes = {
  id: PropTypes.string.isRequired,
  hideModal: PropTypes.func.isRequired,
};

export default connect(null, { hideModal })(DailyReportModal);