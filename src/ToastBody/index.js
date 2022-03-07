import React, { Fragment, useState } from 'react';

import Button from 'react-bootstrap/Button';

import styles from './styles.module.scss';

const ToastBody = ({ message = 'An error has occured', details = '', link = null }) => {
  const [detailsShown, showDetails] = useState(false);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();
    showDetails(!detailsShown);
  };

  return <Fragment>
    <div className={styles.summary}>
      <h6 className={styles.header}>{message}
        {details && <Button onClick={toggleShowDetails} variant='link' className={styles.detailsButton}>{detailsShown ? 'Hide' : 'See'} Details</Button>}
      </h6>
      {link && <Button onClick={() => window.open(link.href, '_blank', 'noopener')} variant='link' className={styles.linkButton}>{link?.title ?? 'Click here'}</Button>}
    </div>
    {details && detailsShown && <div className={styles.details}>
      {details}
    </div>}
  </Fragment>;
};

export default ToastBody;