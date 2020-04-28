import { memo, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { addUserNotification, removeUserNotification } from '../ducks/user-notifications';

const ServiceWorkerWatcher = ({ addUserNotification, removeUserNotification, dispatch:_dispatch, ...rest }) => {
  const [hasCodeUpdateNotification, setHasCodeUpdateNotification] = useState(false);
  
  const onCodeUpdateAvailable = useRef(() => {
    if (!hasCodeUpdateNotification) {

      addUserNotification({
        message: 'You have received an EarthRanger update. Please reload the page to continue.',
        onConfirm(_e, item) {
          setHasCodeUpdateNotification(false);
          removeUserNotification(item.id);
          setTimeout(() => window.location.reload(true));
        },
        onDismiss(_e, item) {
          setHasCodeUpdateNotification(false);
          removeUserNotification(item.id);
        },
        confirmText: 'Reload',
      });

      setHasCodeUpdateNotification(true);
    }
  });
  
  useEffect(() => {
    window.addEventListener('codeUpdateAvailable', onCodeUpdateAvailable.current, false);
    return () => {
      onCodeUpdateAvailable.current && window.removeEventListener('codeUpdateAvailable', onCodeUpdateAvailable.current); // eslint-disable-line
    };
  }, []);
  return null;
};


export default connect(null, ({ addUserNotification, removeUserNotification }))(memo(ServiceWorkerWatcher));