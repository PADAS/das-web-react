import { memo, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addUserNotification, removeUserNotification } from '../ducks/user-notifications';

const ServiceWorkerWatcher = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'serviceWorkerWatcher' });

  const [hasCodeUpdateNotification, setHasCodeUpdateNotification] = useState(false);

  useEffect(() => {
    const onCodeUpdateAvailable = () => {
      if (!hasCodeUpdateNotification) {
        dispatch(addUserNotification({
          date: new Date().toISOString(),
          message: t('newVersionAvailableNotification'),
          onConfirm(_, item) {
            setHasCodeUpdateNotification(false);
            dispatch(removeUserNotification(item.id));
            setTimeout(() => window.location.reload(true));
          },
          onDismiss(event, item) {
            event.preventDefault();
            event.stopPropagation();

            setHasCodeUpdateNotification(false);
            dispatch(removeUserNotification(item.id));
          },
          confirmText: t('confirmNotification'),
        }));

        setHasCodeUpdateNotification(true);
      }
    };

    window.addEventListener('codeUpdateAvailable', onCodeUpdateAvailable, false);

    return () => window.removeEventListener('codeUpdateAvailable', onCodeUpdateAvailable);
  }, [dispatch, hasCodeUpdateNotification, t]);

  return null;
};

export default memo(ServiceWorkerWatcher);
