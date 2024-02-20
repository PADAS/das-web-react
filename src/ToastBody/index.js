import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const ToastBody = ({ details, link, message, showDetailsByDefault }) => {
  const { t } = useTranslation('components', { keyPrefix: 'toastBody' });

  const [detailsShown, showDetails] = useState(showDetailsByDefault);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();

    showDetails(!detailsShown);
  };

  return <>
    <div className={styles.summary}>
      <h6 className={styles.header}>
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

ToastBody.defaultProps = {
  details: '',
  link: null,
  message: null,
  showDetailsByDefault: false,
};

ToastBody.propTypes = {
  details: PropTypes.string,
  link: PropTypes.object,
  message: PropTypes.string,
  showDetailsByDefault: PropTypes.bool,
};

export default ToastBody;
