import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import styles from './styles.module.scss';

const ReportFormErrorMessages = (props) => {
  const { errorData, onClose } = props;

  return <Alert onClose={onClose} dismissible={true} className={styles.saveErrorAlert} data-testid='errors-alert' >
    <Accordion>
      <span>Error saving report.</span>
      <Accordion.Toggle as={Button} variant="link" eventKey="0" className={styles.saveErrorAlertLink} data-testid='error-details-btn'>
        See details
      </Accordion.Toggle>

      <Accordion.Collapse eventKey="0" role="menuitem" aria-expanded='false' >
        <ul>
          {errorData.map(item =>
            <li key={`${item.label} ${item.message}`} data-testid='error-message'>
              <strong>{item.label}</strong>: <span>{item.message}</span>
            </li>)}
        </ul>
      </Accordion.Collapse>
    </Accordion>
  </Alert>;
};

export default memo(ReportFormErrorMessages);

ReportFormErrorMessages.propTypes = {
  errorData: PropTypes.array.isRequired,
  onClose: PropTypes.func,
};