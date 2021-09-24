import React, { Fragment, memo, useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

const ErrorMessage = ({ variant = 'danger', message = 'An error has occured', details = '' }) => {
  const [detailsShown, showDetails] = useState(false);

  const toggleShowDetails = () => showDetails(!detailsShown);

  return <Fragment>
    <h6>{message} {details && <Button onClick={toggleShowDetails} variant='link'>{detailsShown ? 'Hide' : 'Show'} Details</Button>}</h6>
    {details && detailsShown && <Alert variant={variant}>
      {details}
    </Alert>}
  </Fragment>;
};

export default memo(ErrorMessage);