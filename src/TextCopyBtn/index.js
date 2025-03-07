import React, { memo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipboardIcon } from '../common/images/icons/clipboard-icon.svg';

import styles from './styles.module.scss';

const TOAST_AUTOCLOSE_TIME = 2000;

const TextCopyBtn = ({
  className = '',
  getText = null,
  icon = <ClipboardIcon />,
  label = '',
  permitPropagation = false,
  successMessage = null,
  text = null,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'textCopyBtn' });

  const onClickCopy = useCallback(async (event) => {
    event.preventDefault();
    if (!permitPropagation) {
      event.stopPropagation();
    }

    try {
      await window.navigator.clipboard.writeText(text || getText?.() || '');

      toast.info(successMessage || t('defaultToastMessage'), {
        autoClose: TOAST_AUTOCLOSE_TIME,
        hideProgressBar: true,
      });
    } catch (error) {
      console.warn('error copying value to clipboard', error);
    }
  }, [getText, permitPropagation, successMessage, t, text]);

  return <button
      className={`${styles.textCopyButton} ${className}`}
      data-testid="textCopyBtn"
      onClick={onClickCopy}
      type="button"
      {...otherProps}
    >
    {icon}

    {label && <span className={styles.text}>{label}</span> }
  </button>;
};

export default memo(TextCopyBtn);
