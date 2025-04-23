import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const ToastBody = ({ details = '', link = null, message = null, showDetailsByDefault = false }) => {
  const { t } = useTranslation('components', { keyPrefix: 'toastBody' });

  const [detailsShown, showDetails] = useState(showDetailsByDefault);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();

    showDetails(!detailsShown);
  };

  return <>
    <div className={styles.summary}>
      <h6>
        {message || t('defaultMessage')}

        {details && <Button className={styles.detailsButton} onClick={toggleShowDetails} variant="link">
          {t(detailsShown ? 'hideDetailsButton' : 'showDetailsButton')}
        </Button>}
      </h6>

      {link && <Button
        className={styles.linkButton}
        onClick={() => window.open(link.href, '_blank', 'noopener')}
        variant="link"
      >
        {link.title ?? t('defaultLinkTitle')}
      </Button>}
    </div>

    {details && detailsShown && <div className={styles.details}>{details}</div>}
  </>;
};

export default ToastBody;
