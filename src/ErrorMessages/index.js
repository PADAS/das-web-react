import React, { memo, useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const ErrorMessages = ({ errorData, onClose, title }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return <Alert className={styles.alert} dismissible={true} onClose={onClose} data-testid="errors-alert">
    <Accordion onSelect={() => setIsDetailsOpen(!isDetailsOpen)}>
      <span>{title}</span>

      <Accordion.Header
        as={Button}
        className={styles.alertLink}
        eventKey="1"
        variant="link"
      >
        {isDetailsOpen ? 'Hide details' : 'See details'}
      </Accordion.Header>

      <Accordion.Body className={styles.alertList} aria-expanded="false" eventKey="1" role="menuitem">
        <ul>
          {errorData.map((item) => <li key={`${item.label} ${item.message}`} data-testid="error-message">
            <strong>{item.label}</strong>: <span>{item.message}</span>
          </li>)}
        </ul>
      </Accordion.Body>
    </Accordion>
  </Alert>;
};

ErrorMessages.propTypes = {
  errorData: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default memo(ErrorMessages);
