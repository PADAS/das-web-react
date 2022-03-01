import React from 'react';

import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

import ToastBody from '../ToastBody';

export const showToast = ({ message, link, details, toastConfig = {}, }) => {
  toast(<ToastBody message={message} link={link} details={details} />, {
    ...DEFAULT_TOAST_CONFIG,
    type: toast.TYPE.ERROR,
    ...toastConfig,
  });
};