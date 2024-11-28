import React from 'react';
import Button from 'react-bootstrap/Button';
import { ErrorBoundary } from 'react-error-boundary';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../ErrorMessage';

import styles from './styles.module.scss';

const ErrorBoundaryComponent = ({ children }) => {
  const { t } = useTranslation('components', { keyPrefix: 'errorBoundary' });

  const DefaultFallbackComponent = ({ error, resetErrorBoundary }) => <div className={styles.fallback}>
    <ErrorMessage message={error.message} />

    <Button onClick={() => resetErrorBoundary()} type="button" variant="info">{t('reloadButton')}</Button>
  </div>;

  return <ErrorBoundary FallbackComponent={DefaultFallbackComponent}>
    {children}
  </ErrorBoundary>;
};

ErrorBoundaryComponent.proptTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundaryComponent;
