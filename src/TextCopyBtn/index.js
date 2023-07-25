import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { showToast } from '../utils/toast';
import { toast } from 'react-toastify';

import { ReactComponent as ClipboardIcon } from '../common/images/icons/clipboard-icon.svg';
import { ReactComponent as CloseIcon } from '../common/images/icons/cross.svg';

import styles from './styles.module.scss';

const { TYPE: { INFO } } = toast;

const TextCopyBtn = ({ label, text, icon, successMessage, permitPropagation, className }) => {

  const onClickCopy = useCallback(async (e) => {
    e.preventDefault();
    permitPropagation || e.stopPropagation();

    try {
      await window.navigator.clipboard.writeText(text);
      showToast({
        message: successMessage,
        toastConfig: {
          type: INFO,
          autoClose: 2000,
          hideProgressBar: true,
          className: styles.toast,
          closeButton: <CloseIcon className={styles.closeIcon} />
        }
      });
    } catch (error) {
      console.warn('error copying value to clipboard', error);
    }
  }, [permitPropagation, successMessage, text]);

  return <span data-testid='textCopyBtn' className={`${styles.clipboardWrapper} ${className}`}>
    <button type='button' onClick={onClickCopy}>
      { icon }
      {label && <span>{label}</span> }
    </button>
  </span>;
};

TextCopyBtn.defaultProps = {
  icon: <ClipboardIcon />,
  successMessage: 'Copied to clipboard',
  className: '',
  permitPropagation: false,
  label: '',
};

TextCopyBtn.propTypes = {
  text: PropTypes.string.isRequired,
  icon: PropTypes.element,
  successMessage: PropTypes.string,
  className: PropTypes.string,
  permitPropagation: PropTypes.bool,
  label: PropTypes.string,
};

export default memo(TextCopyBtn);