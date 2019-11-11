import React, { Fragment, useState, useEffect, useRef } from 'react';
import ErrorBoundary from 'react-error-boundary'
import Button from 'react-bootstrap/Button';

import { uuid } from '../utils/string';

import styles from './styles.module.scss';

const ErrorBoundaryComponent = (props) => {
  const { children, renderOnError, ...rest } = props;
  const [uniqueId, setId] = useState(uuid());

  const reset = () => setId(uuid());

  const DefaultFallbackComponent = (props) => {
    const { error } = props;
    return <div className={styles.fallback}>
      <h6>An error occured. Please try loading this section again.</h6>
      <Button variant='info' type='button' onClick={reset}>Try again</Button>
      <br />
      <small>Error details: {error.toString()}</small>
    </div>
  };

  const FallbackComponent = ({ componentStack, error }) => renderOnError
    ? renderOnError({ reset, componentStack, error })
    : DefaultFallbackComponent;

  return <ErrorBoundary key={uniqueId} FallbackComponent={FallbackComponent} {...rest}>
    {children}
  </ErrorBoundary>;
};

export default ErrorBoundaryComponent;