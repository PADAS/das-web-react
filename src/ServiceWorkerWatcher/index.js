import { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { addUserNotification, removeUserNotification } from '../ducks/user-notifications';

const ServiceWorkerWatcher = ({ addUserNotification, removeUserNotification, dispatch: _dispatch, ...rest }) => {
  const [hasCodeUpdateNotification, setHasCodeUpdateNotification] = useState(false);

  useEffect(() => {
    const onCodeUpdateAvailable = () => {
      if (!hasCodeUpdateNotification) {
        addUserNotification({
          date: new Date().toISOString(),
          message: 'A new version of EarthRanger is available. It will be loaded the next time you refresh your browser.',
          onConfirm(_e, item) {
            setHasCodeUpdateNotification(false);
            removeUserNotification(item.id);
            setTimeout(() => window.location.reload(true));
          },
          onDismiss(e, item) {
            e.preventDefault();
            e.stopPropagation();
            setHasCodeUpdateNotification(false);
            removeUserNotification(item.id);
          },
          confirmText: 'Reload',
        });

        setHasCodeUpdateNotification(true);
      }
    };

    window.addEventListener('codeUpdateAvailable', onCodeUpdateAvailable, false);
    return () => {
      window.removeEventListener('codeUpdateAvailable', onCodeUpdateAvailable); // eslint-disable-line
    };
  }, [addUserNotification, hasCodeUpdateNotification, removeUserNotification]);
  return null;
};


export default connect(null, ({ addUserNotification, removeUserNotification }))(memo(ServiceWorkerWatcher));