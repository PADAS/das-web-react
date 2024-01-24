import React, { memo, useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const ErrorMessages = ({ errorData, onClose, title }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'errorMessages' });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return <Alert className={styles.alert} data-testid="errors-alert" dismissible={true} onClose={onClose}>
    <Accordion onSelect={() => setIsDetailsOpen(!isDetailsOpen)}>
      <span>{title}</span>

      <Accordion.Header
        as={Button}
        className={styles.alertLink}
        eventKey="1"
        variant="link"
      >
        {t(`accordionHeaderButton.${isDetailsOpen ? 'open' : 'closed'}`)}
      </Accordion.Header>

      <Accordion.Body aria-expanded="false" className={styles.alertList} eventKey="1" role="menuitem">
        <ul>
          {errorData.map((item) => <li data-testid="error-message" key={`${item.label} ${item.message}`}>
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
