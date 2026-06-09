import React, { memo, useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Alert from 'react-bootstrap/Alert';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const ErrorMessages = ({ errorData, onClose, title }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'errorMessages' });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return <Alert className={styles.alert} data-testid="errors-alert" dismissible={true} onClose={onClose}>
    <Accordion onSelect={() => setIsDetailsOpen(!isDetailsOpen)}>
      <span>{title}</span>

      <Accordion.Header
        className={styles.alertLink}
        eventKey="1"
      >
        {t(`accordionHeaderButton.${isDetailsOpen ? 'open' : 'closed'}`)}
      </Accordion.Header>

      <Accordion.Body aria-expanded="false" className={styles.alertList} eventKey="1" role="menuitem">
        <ul>
          {errorData.map((item) => <li data-testid="error-message" key={`${item.label} ${item.message}`}>
            <strong>{item.label}</strong>{item.message && <span>: {item.message}</span>}
          </li>)}
        </ul>
      </Accordion.Body>
    </Accordion>
  </Alert>;
};

export default memo(ErrorMessages);
