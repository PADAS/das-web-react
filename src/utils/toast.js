import React from 'react';

import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';

import ErrorMessage from '../ErrorMessage';

const { POSITION } = toast;

export default (content, config = {}) => toast(content, {
  ...DEFAULT_TOAST_CONFIG, ...config,
});

export const showErrorToast = ({ message, variant, details }) => {
  toast(<ErrorMessage message={message} details={details} variant={variant} />, {
    ...DEFAULT_TOAST_CONFIG,
    type: toast.TYPE.WARNING,
  });
};