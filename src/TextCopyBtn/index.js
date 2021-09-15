import React, { useCallback, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';


import { ReactComponent as ClipboardIcon } from '../common/images/icons/clipboard-icon.svg';

import styles from './styles.module.scss';


const TextCopyBtn = (props) => {
  const { className = '', text = '' } = props;

  const [copySuccess, showCopySuccess] = useState(false);
  const copySuccessMsgAlertTimeout = useRef(null);

  const onCopySuccess = useCallback(() => {
    clearTimeout(copySuccessMsgAlertTimeout.current);
    showCopySuccess(true);

    copySuccessMsgAlertTimeout.current = setTimeout(() => {
      showCopySuccess(false);
    }, [2500]);
  }, []);

  const onClickCopy = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    showCopySuccess(false);

    window.navigator.clipboard.writeText(text)
      .then(() => {
        onCopySuccess();
      })
      .catch((error) => {
        console.warn('error copying value to clipboard', error);
      });

  }, [text, onCopySuccess]);

  return <span className={`${styles.clipboardWrapper} ${className}`}>
    <button type='button' onClick={onClickCopy}>
      <ClipboardIcon />
      {copySuccess && <Alert className={styles.copySuccessMsg} variant='success'>Copied to clipboard</Alert>}
    </button>
  </span>;
};

export default TextCopyBtn;