import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { DEFAULT_TOAST_CONFIG, STATUSES } from '../constants';
import { updateNetworkStatus } from '../ducks/system-status';

const { HEALTHY_STATUS, UNHEALTHY_STATUS } = STATUSES;

const DetectOffline = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'detectOffline' });

  const toastDelay = useRef(null);
  const toastId = useRef(null);

  const [isOnline, setNetwork] = useState(window.navigator.onLine);

  useEffect(() => {
    const updateNetwork = () => {
      setNetwork(window.navigator.onLine);
      dispatch(updateNetworkStatus(window.navigator.onLine ? HEALTHY_STATUS : UNHEALTHY_STATUS));
    };

    window.addEventListener('online', updateNetwork);

    return () => window.removeEventListener('online', updateNetwork);
  }, [dispatch]);

  useEffect(() => {
    clearTimeout(toastDelay.current);

    if (!isOnline) {
      toastDelay.current = setTimeout(() => {
        toastId.current = toast(<div><p>{t('offlineToastMessage')}</p></div>, {
          autoClose: 10000,
          onClose: () => {
            toastId.current = null;
          },
          type: toast.TYPE.ERROR,
          ...DEFAULT_TOAST_CONFIG,
        });
      }, 2000);
    } else if (toastId.current) {
      toast.update(toastId.current, {
        render: t('reconnectionToastMessage'),
        type: toast.TYPE.SUCCESS,
      });

      setTimeout(() => {
        if (toastId.current) {
          toast.dismiss(toastId.current);
        }
        toastId.current = null;
      }, 2000);
    }

    return () => clearTimeout(toastDelay.current);
  }, [isOnline, t]);

  return null;
};

export default DetectOffline;
