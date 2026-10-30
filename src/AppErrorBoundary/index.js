import { APP_ERROR_CATEGORY, trackEventFactory } from '../utils/analytics';
import getWindowLocation from '../utils/getWindowLocation';

import ErrorBoundary from '../ErrorBoundary';

const appErrorTracker = trackEventFactory(APP_ERROR_CATEGORY);

const AppErrorBoundary = ({ children }) => {
  const onError = (error) => appErrorTracker.track('See the app error screen', error?.name);

  const onReset = () => getWindowLocation().reload();

  return <ErrorBoundary onError={onError} onReset={onReset}>
    {children}
  </ErrorBoundary>;
};

export default AppErrorBoundary;
