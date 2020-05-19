import { memo, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { addUserNotification, removeUserNotification } from '../ducks/user-notifications';

const ServiceWorkerWatcher = ({ addUserNotification, removeUserNotification, dispatch:_dispatch, ...rest }) => {
  const [hasCodeUpdateNotification, setHasCodeUpdateNotification] = useState(false);
  
  const onCodeUpdateAvailable = useRef(() => {
    if (!hasCodeUpdateNotification) {

      addUserNotification({
        message: 'A new version of EarthRanger is available. It will be loaded the next time you refresh your browser.',
        //infolink: 'https://earthranger.com/News/2020/Major-EarthRanger-Release-Summer-2020.aspx',
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