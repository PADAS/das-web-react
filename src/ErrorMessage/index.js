import React, { Fragment, memo, useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

const ErrorMessage = ({ message = 'An error has occured', details = 'hoopy doopy poopy doo' }) => {
  const [detailsShown, showDetails] = useState(false);

  const toggleShowDetails = () => showDetails(!detailsShown);
  
  return <Fragment>
    <h6>{message} {details && <Button onClick={toggleShowDetails} variant='link'>{detailsShown ? 'Hide' : 'Show'} Details</Button>}</h6>
    {details && detailsShown && <Alert variant='danger'>
      {details}
    </Alert>}
  </Fragment>;
};

export default memo(ErrorMessage);