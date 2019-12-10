import React, { useState } from 'react';
import ErrorBoundary from 'react-error-boundary'
import Button from 'react-bootstrap/Button';

import { uuid } from '../utils/string';

import ErrorMessage from '../ErrorMessage';

import styles from './styles.module.scss';

const ErrorBoundaryComponent = (props) => {
  const { children, renderOnError, ...rest } = props;
  const [uniqueId, setId] = useState(uuid());

  const reset = () => setId(uuid());

  const DefaultFallbackComponent = (props) => {
    const { componentStack, error } = props;
    return <div className={styles.fallback}>
      <ErrorMessage message={error.toString()} details={componentStack} />
      <Button variant='info' type='button' onClick={reset}>Reload</Button>
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