import React, { useCallback, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';

import { updateNetworkStatus } from '../ducks/system-status';

import { DEFAULT_TOAST_CONFIG, STATUSES } from '../constants';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

const DetectOffline = ({ updateNetworkStatus }) => {
  const [isOnline, setNetwork] = useState(window.navigator.onLine);
  const toastDelay = useRef(null);
  const toastId = useRef(null);

  const updateNetwork = useCallback(() => {
    const { onLine } = window.navigator;

    setNetwork(onLine);
    updateNetworkStatus(onLine ? HEALTHY_STATUS : UNHEALTHY_STATUS);
  }, [updateNetworkStatus]);

  const onToastClose = () => {
    if (toastId.current) {
      toastId.current = null;
    }
  };

  useEffect(() => {
    window.addEventListener('online', updateNetwork);
    return () => {
      window.removeEventListener('online', updateNetwork);
    };
  }, [updateNetwork]);

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
            type: toast.TYPE.ERROR,
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

  return null;
};

export default connect(null, { updateNetworkStatus })(DetectOffline);