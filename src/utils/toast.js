import React from 'react';

import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

import ErrorMessage from '../ErrorMessage';

export default (content, config = {}) => toast(content, {
  ...DEFAULT_TOAST_CONFIG, ...config,
});

export const showErrorToast = (message, details) => {
  toast(<ErrorMessage message={message} details={details} />, {
    type: toast.TYPE.ERROR,
  });
}