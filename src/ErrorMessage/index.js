import React, { Fragment, memo, useState } from 'react';

import Button from 'react-bootstrap/Button';

import styles from './styles.module.scss';

const ErrorMessage = ({ message = 'An error has occured', details = '' }) => {
  const [detailsShown, showDetails] = useState(false);

  const toggleShowDetails = (event) => {
    event.preventDefault();
    event.stopPropagation();
    showDetails(!detailsShown);
  };

  return <Fragment>
    <h6 className={styles.header}>{message} {details && <Button onClick={toggleShowDetails} variant='link' className={styles.detailsButton}>{detailsShown ? 'Hide' : 'See'} Details</Button>}</h6>
    {details && detailsShown && <div className={styles.details}>
      {details}
    </div>}
  </Fragment>;
};

export default memo(ErrorMessage);