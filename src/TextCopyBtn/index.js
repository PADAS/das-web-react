import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipboardIcon } from '../common/images/icons/clipboard-icon.svg';
import { ReactComponent as CloseIcon } from '../common/images/icons/cross.svg';

import { showToast } from '../utils/toast';

import styles from './styles.module.scss';

const TextCopyBtn = ({ className, getText, icon, label, permitPropagation, successMessage, text }) => {
  const { t } = useTranslation('components', { keyPrefix: 'textCopyBtn' });

  const onClickCopy = useCallback(async (event) => {
    event.preventDefault();
    if (!permitPropagation) {
      event.stopPropagation();
    }

    try {
      await window.navigator.clipboard.writeText(text || getText());
      showToast({
        message: successMessage || t('defaultToastMessage'),
        toastConfig: {
          autoClose: 2000,
          className: styles.toast,
          closeButton: <CloseIcon className={styles.closeIcon} />,
          hideProgressBar: true,
          type: toast.TYPE.INFO,
        }
      });
    } catch (error) {
      console.warn('error copying value to clipboard', error);
    }
  }, [getText, permitPropagation, successMessage, t, text]);

  return <span className={`${styles.clipboardWrapper} ${className}`}>
    <button data-testid="textCopyBtn" onClick={onClickCopy} type="button">
      {icon}

      {label && <span>{label}</span> }
    </button>
  </span>;
};

TextCopyBtn.defaultProps = {
  className: '',
  getText: null,
  icon: <ClipboardIcon />,
  label: '',
  permitPropagation: false,
  successMessage: null,
  text: null,
};

TextCopyBtn.propTypes = {
  className: PropTypes.string,
  getText: PropTypes.func,
  icon: PropTypes.element,
  label: PropTypes.string,
  permitPropagation: PropTypes.bool,
  successMessage: PropTypes.string,
  text: PropTypes.string,
};

export default memo(TextCopyBtn);
