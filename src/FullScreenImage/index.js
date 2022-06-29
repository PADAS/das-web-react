import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';

import { downloadFileFromUrl } from '../utils/download';
import { hideFullScreenImage } from '../ducks/full-screen-image';

import styles from './styles.module.scss';

const ESC_KEY_CODE = 27;

const FullScreenImage = () => {
  const dispatch = useDispatch();

  const { file, source } = useSelector((state) => state.view.fullScreenImage);

  const imageRef = useRef();

  const onClickDownloadIcon = useCallback((event) => {
    event.stopPropagation();

    downloadFileFromUrl(file.url, { filename: file.filename });
  }, [file?.filename, file?.url]);

  const onClickFullScreenBrackground = useCallback(() => dispatch(hideFullScreenImage()), [dispatch]);

  const onClickFullScreenElement = useCallback((event) => event.stopPropagation(), []);

  useEffect(() => {
    const onKeydown = (event) => {
      if (event.keyCode === ESC_KEY_CODE) {
        dispatch(hideFullScreenImage());
      }
    };

    document.addEventListener('keydown', onKeydown);

    return () => document.removeEventListener('keydown', onKeydown);
  }, [dispatch]);

  return !!source ? <div
      className={styles.fullScreenBackground}
      data-testid="fullScreenImage-background"
      onClick={onClickFullScreenBrackground}
    >
    <div className={styles.header}>
      <div className={styles.leftSpace} />

      <h2 className={styles.title} onClick={onClickFullScreenElement}>{file.filename}</h2>

      <div>
        <DownloadArrowIcon onClick={onClickDownloadIcon} />

        <CrossIcon />
      </div>
    </div>

    <div className={styles.imageContainer}>
      <img
        alt={`Full screen ${file.filename}`}
        className={styles.fullScreenImage}
        onClick={onClickFullScreenElement}
        ref={imageRef}
        src={source}
      />
    </div>
  </div> : null;
};

export default FullScreenImage;
