import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';

import { downloadFileFromUrl } from '../utils/download';
import { removeModal } from '../ducks/modals';

import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const ImageModal = ({ id, mediaType = 'image', src, title, url, tracker }) => {
  const dispatch = useDispatch();

  const imageRef = useRef();
  const downloadIconRef = useRef();
  const titleRef = useRef();
  const { t } = useTranslation('details-view', { keyPrefix: 'imageModal' });

  const [error, setErrorState] = useState(false);
  const [loaded, setLoadState] = useState(false);

  const setImageLoaded = useCallback(() => setLoadState(true), []);

  const setImageError = useCallback(() => {
    tracker?.track(`Error loading ${mediaType}`);

    setErrorState(true);
    setImageLoaded();
  }, [mediaType, setImageLoaded, tracker]);

  const onClickDownload = useCallback(() => {
    tracker?.track('Click image download button');

    downloadFileFromUrl(url, { filename: title });
  }, [title, tracker, url]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!imageRef.current?.contains(event.target)
        && !downloadIconRef.current?.contains(event.target)
        && !titleRef.current?.contains(event.target)) {
        tracker?.track('Click modal background to close image modal');

        dispatch(removeModal(id));
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);

    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [dispatch, id, tracker]);

  return <>
    <Header className={styles.header}>
      <div className={styles.leftSpace} />

      <Title className={styles.title} ref={titleRef}>
        {title}
      </Title>

      <div>
        <DownloadArrowIcon onClick={onClickDownload} ref={downloadIconRef} />

        <label>X</label>
      </div>
    </Header>

    <Body className={styles.body}>
      {!loaded && <LoadingOverlay />}

      {!error && mediaType === 'video' && <video
        aria-label={title}
        controls
        onError={setImageError}
        onLoadedData={setImageLoaded}
        ref={imageRef}
        src={src}
        style={{ display: loaded ? 'block' : 'none' }}
      />}

      {!error && mediaType === 'image' && <img
        alt={title}
        onError={setImageError}
        onLoad={setImageLoaded}
        ref={imageRef}
        src={src}
        style={{ display: loaded ? 'block' : 'none' }}
      />}

      {error && <>
        <h5>{t('errorTitle')}</h5>
        <h6>{t('errorMessage')}</h6>
      </>}
    </Body>
  </>;
};

export default memo(ImageModal);
