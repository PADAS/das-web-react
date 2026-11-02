import { useId } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import getWindowLocation from '../utils/getWindowLocation';

import * as styles from './styles.module.scss';

export const RootErrorFallback = () => {
  const { t } = useTranslation('components', { keyPrefix: 'rootErrorBoundary' });

  const messageId = useId();
  const titleId = useId();

  // The defaults cover a crash that happens before the translations load.
  return <main className={styles.fallback}>
    <h1 className={styles.title} id={titleId}>
      {t('errorTitle', { defaultValue: 'Something went wrong' })}
    </h1>

    <p className={styles.message} id={messageId}>
      {t('reloadMessage', {
        defaultValue: 'EarthRanger ran into an unexpected problem. Reload the page to continue.',
      })}
    </p>

    <button
      aria-describedby={`${titleId} ${messageId}`}
      // The crash drops focus, so the button takes it and announces the page.
      autoFocus
      className={styles.reloadButton}
      onClick={() => getWindowLocation().reload()}
      type="button"
    >
      {t('reloadButtonLabel', { defaultValue: 'Reload' })}
    </button>
  </main>;
};

const RootErrorBoundary = ({ children }) => <ErrorBoundary FallbackComponent={RootErrorFallback}>
  {children}
</ErrorBoundary>;

export default RootErrorBoundary;
