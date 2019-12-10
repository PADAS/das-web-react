import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Alert from 'react-bootstrap/Alert';

import { generateErrorListForApiResponseDetails } from '../utils/events';

import styles from './styles.module.scss';

const ReportFormErrorMessages = (props) => {
  const { errorData, onClose } = props;
  return <Alert onClose={onClose} dismissible={true} className={styles.saveErrorAlert} variant='danger'>
    <h5>Error saving report: {errorData.message}</h5>
    {<ul>
      {generateErrorListForApiResponseDetails(errorData).map(item =>
        <li key={`${item.label} ${item.message}`}>
          <strong>{item.label}</strong>: <span>{item.message}</span>
        </li>)}
    </ul>}
  </Alert>;
};

export default memo(ReportFormErrorMessages);

ReportFormErrorMessages.propTypes = {
  errorData: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};