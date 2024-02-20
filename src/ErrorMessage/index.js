import React, { memo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

const ErrorMessage = ({ details, message }) => {
  const { t } = useTranslation('components', { keyPrefix: 'errorMessage' });

  const [detailsShown, showDetails] = useState(false);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();

    showDetails(!detailsShown);
  };

  return <>
    <h6 className={styles.header}>
      {message || t('defaultMessage')} {details && <Button
        className={styles.detailsButton}
        onClick={toggleShowDetails}
        variant='link'
      >
        {t(detailsShown ? 'hideDetailsButton' : 'showDetailsButton')}
      </Button>}
    </h6>

    {details && detailsShown && <div className={styles.details}>{details}</div>}
  </>;
};

ErrorMessage.defaultProps = {
  details: '',
  message: null,
};

ErrorMessage.propTypes = {
  details: PropTypes.string,
  message: PropTypes.string,
};

export default memo(ErrorMessage);
