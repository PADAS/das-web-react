import React from 'react';

import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

import ToastBody from '../ToastBody';

export const showToast = ({ message, link, details, toastConfig = {}, showDetailsByDefault = false }) => {
  return toast(<ToastBody message={message} link={link} details={details} showDetailsByDefault={showDetailsByDefault} />, {
    ...DEFAULT_TOAST_CONFIG,
    ...toastConfig,
  });
};