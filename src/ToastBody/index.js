import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const ToastBody = ({ message, details, link, showDetailsByDefault }) => {
  const [detailsShown, showDetails] = useState(showDetailsByDefault);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();
    showDetails(!detailsShown);
  };

  return <>
    <div className={styles.summary}>
      <h6 className={styles.header}>{message}
        {details && <Button onClick={toggleShowDetails} variant='link' className={styles.detailsButton}>{detailsShown ? 'Hide' : 'See'} Details</Button>}
      </h6>
      {link && <Button onClick={() => window.open(link.href, '_blank', 'noopener')} variant='link' className={styles.linkButton}>{link?.title ?? 'Click here'}</Button>}
    </div>
    {details && detailsShown && <div className={styles.details}>
      {details}
    </div>}
  </>;
};

ToastBody.defaultProps = {
  message: 'An error has occurred',
  details: '',
  link: null,
  showDetailsByDefault: false,
};

ToastBody.propTypes = {
  message: PropTypes.string,
  details: PropTypes.string,
  link: PropTypes.object,
  showDetailsByDefault: PropTypes.bool,
};

export default ToastBody;