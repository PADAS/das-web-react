import Button from 'react-bootstrap/Button';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../ErrorMessage';

import * as styles from './styles.module.scss';

const ErrorBoundaryComponent = ({ children, onError, onReset }) => {
  const { t } = useTranslation('components', { keyPrefix: 'errorBoundary' });

  const DefaultFallbackComponent = ({ error, resetErrorBoundary }) => <div className={styles.fallback}>
    <ErrorMessage message={error.message} />

    <Button onClick={() => resetErrorBoundary()} type="button" variant="info">{t('reloadButton')}</Button>
  </div>;

  return <ErrorBoundary FallbackComponent={DefaultFallbackComponent} onError={onError} onReset={onReset}>
    {children}
  </ErrorBoundary>;
};

export default ErrorBoundaryComponent;
