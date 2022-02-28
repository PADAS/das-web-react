import React, { memo, useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

const DetectOffline = () => {
  const [isOnline, setNetwork] = useState(window.navigator.onLine);
  const toastDelay = useRef(null);
  const toastId = useRef(null);
  const updateNetwork = () => {
    setNetwork(window.navigator.onLine);
  };

  const onToastClose = () => {
    if (toastId.current) {
      toastId.current = null;
    }
  };

  useEffect(() => {
    window.addEventListener('offline', updateNetwork);
    window.addEventListener('online', updateNetwork);
    return () => {
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('online', updateNetwork);
    };
  });

  const handleReconnect = () => {
    if (toastId.current) {
      toast.update(
        toastId.current, {
          render: 'Back online!',
          type: toast.TYPE.SUCCESS,
        }
      );
      setTimeout(() => {
        toastId.current && toast.dismiss(toastId.current);
        toastId.current = null;
      }, 2000);
    }
  };

  useEffect(() => {
    const showOfflineToast = () => {
      toastDelay.current = setTimeout(
        () => {
          toastId.current = toast(<div>
            <p>You are currently offline.
              EarthRanger may not function as expected.
              Please check your network connection.</p>
          </div>, {
            autoClose: 10000,
            closeOnClick: false,
            type: toast.TYPE.INFO,
            onClose: onToastClose,
            ...DEFAULT_TOAST_CONFIG,
          });
        }, 2000);
    };
    clearTimeout(toastDelay.current);

    if (!isOnline) {
      showOfflineToast();
    } else {
      handleReconnect();
    }
    return () => {
      clearTimeout(toastDelay.current);
    };
  }, [isOnline]);
};

export default memo(DetectOffline);