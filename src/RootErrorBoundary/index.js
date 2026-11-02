import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo.svg';

import getWindowLocation from '../utils/getWindowLocation';

import * as styles from './styles.module.scss';

const RootErrorFallback = () => {
  const { t } = useTranslation('components', { keyPrefix: 'rootErrorBoundary' });

  return <main className={styles.fallback}>
    <EarthRangerLogo aria-hidden className={styles.logo} />

    <div className={styles.content}>
      <h1 className={styles.title}>{t('errorTitle')}</h1>

      <p className={styles.message}>{t('reloadMessage')}</p>

      <button className={styles.reloadButton} onClick={() => getWindowLocation().reload()} type="button">
        {t('reloadButtonLabel')}
      </button>
    </div>
  </main>;
};

const RootErrorBoundary = ({ children }) => <ErrorBoundary FallbackComponent={RootErrorFallback}>
  {children}
</ErrorBoundary>;

export default RootErrorBoundary;
