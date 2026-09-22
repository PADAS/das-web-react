import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';

import { downloadFileFromUrl } from '../utils/download';
import { removeModal } from '../ducks/modals';
import useMediaObjectUrl from '../hooks/useMediaObjectUrl';

import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const MediaModal = ({ id, mediaType = 'image', src = null, title, url, tracker }) => {
  const dispatch = useDispatch();

  const mediaRef = useRef();
  const downloadIconRef = useRef();
  const titleRef = useRef();
  const { t } = useTranslation('details-view', { keyPrefix: 'mediaModal' });

  const [error, setErrorState] = useState(false);
  const [loaded, setLoadState] = useState(false);

  // Videos are opened without a `src` because their urls need an authenticated fetch.
  const { error: fetchError, objectUrl } = useMediaObjectUrl(src ? null : url);

  const mediaSource = src ?? objectUrl;

  const setMediaLoaded = useCallback(() => setLoadState(true), []);

  const setMediaError = useCallback(() => {
    tracker?.track(`Error loading ${mediaType}`);

    setErrorState(true);
    setMediaLoaded();
  }, [mediaType, setMediaLoaded, tracker]);

  const showError = error || fetchError;

  const onClickDownload = useCallback(() => {
    tracker?.track('Click media download button');

    downloadFileFromUrl(url, { filename: title });
  }, [title, tracker, url]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!mediaRef.current?.contains(event.target)
        && !downloadIconRef.current?.contains(event.target)
        && !titleRef.current?.contains(event.target)) {
        tracker?.track('Click modal background to close media modal');

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
      {!loaded && !showError && <LoadingOverlay />}

      {!showError && mediaSource && mediaType === 'video' && <video
        aria-label={title}
        controls
        onError={setMediaError}
        onLoadedData={setMediaLoaded}
        ref={mediaRef}
        src={mediaSource}
        style={{ display: loaded ? 'block' : 'none' }}
      />}

      {!showError && mediaSource && mediaType === 'image' && <img
        alt={title}
        onError={setMediaError}
        onLoad={setMediaLoaded}
        ref={mediaRef}
        src={mediaSource}
        style={{ display: loaded ? 'block' : 'none' }}
      />}

      {showError && <>
        <h5>{t('errorTitle')}</h5>
        <h6>{t('errorMessage')}</h6>
      </>}
    </Body>
  </>;
};

export default memo(MediaModal);
