import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BREAKPOINTS, DAS_HOST, SIDEBAR_WIDTH_PIXELS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../../constants';
import { calcMaxOtusTabWidth, clampOtusTabWidth } from '../../utils/otus';
import { selectOtusTabWidth } from '../../selectors/otus';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import LoadingOverlay from '../../LoadingOverlay';

import Header from './Header';

import * as styles from './styles.module.scss';

const KEYBOARD_RESIZE_STEP_PIXELS = 16;

export const OTUS_COMMANDS = { NEW_THREAD: 'new-thread', TOGGLE_THREADS: 'toggle-threads' };
export const OTUS_MESSAGE_TYPES = { COMMAND: 'otus:command', CONNECT: 'otus:connect', READY: 'otus:ready' };

const WIDTH_BY_RESIZE_KEY = {
  ArrowLeft: (width) => width - KEYBOARD_RESIZE_STEP_PIXELS,
  ArrowRight: (width) => width + KEYBOARD_RESIZE_STEP_PIXELS,
  End: calcMaxOtusTabWidth,
  Home: () => SIDEBAR_WIDTH_PIXELS,
};

const OtusTab = ({ isActive, url }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.otusTab' });

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const navigate = useNavigate();

  const otusTabWidth = useSelector(selectOtusTabWidth);
  const token = useSelector((state) => state.data.token?.access_token);

  const iframeRef = useRef(null);

  const panelId = useId();
  const titleId = useId();

  const [hasBeenActivated, setHasBeenActivated] = useState(isActive);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [widthWhileResizing, setWidthWhileResizing] = useState(null);

  // The frame boots a per-user sandbox, so it waits for the first visit.
  if (isActive && !hasBeenActivated) setHasBeenActivated(true);

  // The handle unmounts without a pointer up when the layout narrows mid-drag.
  if (!isMediumLayoutOrLarger && widthWhileResizing !== null) setWidthWhileResizing(null);

  const isResizing = widthWhileResizing !== null;
  const width = widthWhileResizing ?? otusTabWidth;

  const embedUrl = new URL(url);
  embedUrl.searchParams.set('embed', '1');
  embedUrl.searchParams.set('titlebar', '0');

  const isLoading = loadedUrl !== embedUrl.href;
  const otusOrigin = embedUrl.origin;

  const postCommand = useCallback((command) => {
    iframeRef.current?.contentWindow?.postMessage({ command, type: OTUS_MESSAGE_TYPES.COMMAND }, otusOrigin);
  }, [otusOrigin]);

  const postConnect = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { site_url: DAS_HOST, token, type: OTUS_MESSAGE_TYPES.CONNECT },
      otusOrigin
    );
  }, [otusOrigin, token]);

  const onClose = useCallback(() => navigate('/'), [navigate]);

  const onKeyDownResizeHandle = (event) => {
    const calcWidth = WIDTH_BY_RESIZE_KEY[event.key];

    if (calcWidth) {
      event.preventDefault();

      dispatch(updateUserPreferences({ otusTabWidth: clampOtusTabWidth(calcWidth(width)) }));
    }
  };

  const onNewConversation = useCallback(() => postCommand(OTUS_COMMANDS.NEW_THREAD), [postCommand]);

  // The cross-origin frame swallows the drag as soon as the pointer reaches it,
  // so the handle captures the pointer and the frame stops taking events.
  const onPointerDownResizeHandle = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    setWidthWhileResizing(width);
  };

  const onPointerMoveResizeHandle = (event) => {
    if (isResizing) setWidthWhileResizing(clampOtusTabWidth(event.clientX - VERTICAL_NAV_RAIL_WIDTH_PIXELS));
  };

  // The width is only stored once the drag ends, since it is persisted.
  const onPointerUpResizeHandle = () => {
    if (isResizing) {
      dispatch(updateUserPreferences({ otusTabWidth: widthWhileResizing }));

      setWidthWhileResizing(null);
    }
  };

  const onRevertResize = () => setWidthWhileResizing(null);

  const onToggleRecent = useCallback(() => postCommand(OTUS_COMMANDS.TOGGLE_THREADS), [postCommand]);

  useEffect(() => {
    const onMessage = (event) => {
      if (token
        && event.origin === otusOrigin
        && event.source === iframeRef.current?.contentWindow
        && event.data?.type === OTUS_MESSAGE_TYPES.READY) {
        postConnect();
      }
    };

    // Otus repeats its ready message after each reload, so we keep listening.
    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [otusOrigin, postConnect, token]);

  return <section
    aria-labelledby={titleId}
    className={`${styles.otusTab} ${isActive ? styles.active : ''} ${isResizing ? styles.resizing : ''}`}
    id={panelId}
    style={isMediumLayoutOrLarger ? { width } : undefined}
    >
    <Header onClose={onClose} onNewConversation={onNewConversation} onToggleRecent={onToggleRecent} titleId={titleId} />

    {hasBeenActivated && <div className={styles.frameWrapper}>
      {isLoading && <LoadingOverlay message={t('loadingMessage')} role="status" />}

      <iframe
        allow="clipboard-write"
        className={styles.frame}
        onLoad={() => setLoadedUrl(embedUrl.href)}
        ref={iframeRef}
        src={embedUrl.href}
        title={t('iframeTitle')}
      />
    </div>}

    {isMediumLayoutOrLarger && <div
      aria-controls={panelId}
      aria-label={t('resizeHandleLabel')}
      aria-orientation="vertical"
      aria-valuemax={calcMaxOtusTabWidth()}
      aria-valuemin={SIDEBAR_WIDTH_PIXELS}
      aria-valuenow={width}
      className={styles.resizeHandle}
      onKeyDown={onKeyDownResizeHandle}
      onLostPointerCapture={onRevertResize}
      onPointerCancel={onRevertResize}
      onPointerDown={onPointerDownResizeHandle}
      onPointerMove={onPointerMoveResizeHandle}
      onPointerUp={onPointerUpResizeHandle}
      role="separator"
      tabIndex={0}
    />}
  </section>;
};

export default memo(OtusTab);
