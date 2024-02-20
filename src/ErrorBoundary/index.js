import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ErrorBoundary from 'react-error-boundary';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { uuid } from '../utils/string';

import ErrorMessage from '../ErrorMessage';

import styles from './styles.module.scss';

const ErrorBoundaryComponent = ({ children, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'errorBoundary' });

  const [uniqueId, setId] = useState(uuid());

  const DefaultFallbackComponent = ({ componentStack, error }) => <div className={styles.fallback}>
    <ErrorMessage details={componentStack} message={error.toString()} />

    <Button onClick={() => setId(uuid())} type="button" variant="info">{t('reloadButton')}</Button>
  </div>;

  return <ErrorBoundary FallbackComponent={DefaultFallbackComponent} key={uniqueId} {...restProps}>
    {children}
  </ErrorBoundary>;
};

ErrorBoundaryComponent.proptTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundaryComponent;
