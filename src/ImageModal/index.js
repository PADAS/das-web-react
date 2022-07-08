import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as DownloadArrowIcon } from '../common/images/icons/download-arrow.svg';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { removeModal } from '../ducks/modals';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { ENABLE_REPORT_NEW_UI } = DEVELOPMENT_FEATURE_FLAGS;

const { Header, Title, Body } = Modal;

const ImageModal = ({ id, onDownload, src, title }) => {
  const dispatch = useDispatch();

  const imageRef = useRef();
  const downloadIconRef = useRef();
  const titleRef = useRef();

  const [error, setErrorState] = useState(false);
  const [loaded, setLoadState] = useState(false);

  const setImageLoaded = useCallback(() => setLoadState(true), []);

  const setImageError = useCallback(() => {
    setErrorState(true);
    setImageLoaded();
  }, [setImageLoaded]);

  useEffect(() => {
    if (ENABLE_REPORT_NEW_UI) {
      const handleClickOutside = (event) => {
        if (!imageRef.current?.contains(event.target)
          && !downloadIconRef.current?.contains(event.target)
          && !titleRef.current?.contains(event.target)) {
          dispatch(removeModal(id));
        }
      };

      document.addEventListener('mousedown', handleClickOutside);

      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dispatch, id]);

  return <>
    <Header className={ENABLE_REPORT_NEW_UI ? styles.header : ''} closeButton={!ENABLE_REPORT_NEW_UI}>
      {ENABLE_REPORT_NEW_UI && <div className={styles.leftSpace} />}

      <Title className={ENABLE_REPORT_NEW_UI ? styles.title : ''} ref={titleRef}>
        {title}
      </Title>

      {ENABLE_REPORT_NEW_UI && <div>
        <DownloadArrowIcon onClick={onDownload} ref={downloadIconRef} />

        <CrossIcon />
      </div>}
    </Header>

    <Body className={styles.body}>
      {!loaded && <LoadingOverlay />}

      {!error && <img
        alt={title}
        onError={setImageError}
        onLoad={setImageLoaded}
        ref={imageRef}
        src={src}
        style={{ display: loaded ? 'block' : 'none' }}
      />}

      {error && <>
        <h5>Error loading image.</h5>
        <h6>If you uploaded this file recently, please wait a minute and try again.</h6>
      </>}
    </Body>
  </>;
};

export default memo(ImageModal);

ImageModal.defaultProps = {
  onDownload: null,
  title: 'View image:',
};

ImageModal.propTypes = {
  id: PropTypes.string.isRequired,
  onDownload: PropTypes.func,
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
};
