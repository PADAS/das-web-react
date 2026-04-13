import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { DAS_HOST, REACT_APP_OTUS_URL } from '../../constants';

import * as styles from './styles.module.scss';

const OTUS_EMBED_URL = `${REACT_APP_OTUS_URL}/embed`;

/**
 * OtusPane — renders the Otus AI assistant in an iframe.
 *
 * Credentials (site URL + bearer token) are passed via postMessage once the
 * iframe has loaded.  The iframe never receives credentials through the URL,
 * query-string, or any other persistent channel.
 */
const OtusPane = () => {
  const iframeRef = useRef(null);
  const token = useSelector((state) => state.data.token);

  const onIframeLoad = useCallback(() => {
    if (!iframeRef.current || !token?.access_token) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'otus-credentials',
        er_site_url: DAS_HOST,
        er_api_key: token.access_token,
      },
      REACT_APP_OTUS_URL
    );
  }, [token]);

  return (
    <iframe
      className={styles.iframe}
      onLoad={onIframeLoad}
      ref={iframeRef}
      src={OTUS_EMBED_URL}
      title="Otus AI Assistant"
    />
  );
};

export default OtusPane;
