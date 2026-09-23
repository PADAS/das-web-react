import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  BREAKPOINTS,
  DAS_HOST,
  SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS,
  SIDEBAR_WIDTH_PIXELS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import LoadingOverlay from '../../LoadingOverlay';

import Header from './Header';

import * as styles from './styles.module.scss';

const KEYBOARD_RESIZE_STEP_PIXELS = 16;

export const OTUS_COMMANDS = { NEW_THREAD: 'new-thread', TOGGLE_THREADS: 'toggle-threads' };
export const OTUS_MESSAGE_TYPES = { COMMAND: 'otus:command', CONNECT: 'otus:connect', READY: 'otus:ready' };

const calcMaxWidthPixels = () => window.innerWidth - VERTICAL_NAV_RAIL_WIDTH_PIXELS;

const clampWidth = (width) => Math.min(Math.max(width, SIDEBAR_WIDTH_PIXELS), calcMaxWidthPixels());

const WIDTH_BY_RESIZE_KEY = {
  ArrowLeft: (width) => width - KEYBOARD_RESIZE_STEP_PIXELS,
  ArrowRight: (width) => width + KEYBOARD_RESIZE_STEP_PIXELS,
  End: calcMaxWidthPixels,
  Home: () => SIDEBAR_WIDTH_PIXELS,
};

const OtusTab = ({ isActive, url }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.otusTab' });

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const navigate = useNavigate();

  const otusTabWidth = useSelector((state) => state.view.userPreferences.otusTabWidth);
  const token = useSelector((state) => state.data.token?.access_token);

  const iframeRef = useRef(null);
  const isFrameReadyRef = useRef(false);

  const panelId = useId();

  const [hasBeenActivated, setHasBeenActivated] = useState(isActive);
  const [isLoading, setIsLoading] = useState(true);
  const [widthWhileResizing, setWidthWhileResizing] = useState(null);

  // The frame boots a per-user sandbox, so it waits for the first visit.
  if (isActive && !hasBeenActivated) setHasBeenActivated(true);

  // The handle unmounts without a pointer up when the layout narrows mid-drag.
  if (!isMediumLayoutOrLarger && widthWhileResizing !== null) setWidthWhileResizing(null);

  const customWidth = isMediumLayoutOrLarger ? (widthWhileResizing ?? otusTabWidth) : null;
  const isResizing = widthWhileResizing !== null;
  const width = clampWidth(customWidth ?? SIDEBAR_DETAIL_VIEW_WIDTH_PIXELS);

  const embedUrl = new URL(url);
  embedUrl.searchParams.set('embed', '1');
  embedUrl.searchParams.set('titlebar', '0');

  const otusOrigin = embedUrl.origin;

  const onClose = useCallback(() => navigate('/'), [navigate]);

  const postCommand = useCallback((command) => {
    iframeRef.current?.contentWindow?.postMessage({ command, type: OTUS_MESSAGE_TYPES.COMMAND }, otusOrigin);
  }, [otusOrigin]);

  const postConnect = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { site_url: DAS_HOST, token, type: OTUS_MESSAGE_TYPES.CONNECT },
      otusOrigin
    );
  }, [otusOrigin, token]);

  const onNewConversation = useCallback(() => postCommand(OTUS_COMMANDS.NEW_THREAD), [postCommand]);

  const onToggleRecent = useCallback(() => postCommand(OTUS_COMMANDS.TOGGLE_THREADS), [postCommand]);

  const onKeyDownResizeHandle = (event) => {
    const calcWidth = WIDTH_BY_RESIZE_KEY[event.key];

    if (calcWidth) {
      event.preventDefault();

      dispatch(updateUserPreferences({ otusTabWidth: clampWidth(calcWidth(width)) }));
    }
  };

  // The cross-origin frame swallows the drag as soon as the pointer reaches it,
  // so the handle captures the pointer and the frame stops taking events.
  const onPointerDownResizeHandle = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    setWidthWhileResizing(width);
  };

  const onPointerMoveResizeHandle = (event) => {
    if (isResizing) setWidthWhileResizing(clampWidth(event.clientX - VERTICAL_NAV_RAIL_WIDTH_PIXELS));
  };

  // The width is only stored once the drag ends, since it is persisted.
  const onPointerUpResizeHandle = () => {
    if (isResizing) {
      dispatch(updateUserPreferences({ otusTabWidth: widthWhileResizing }));

      setWidthWhileResizing(null);
    }
  };

  const onRevertResize = () => setWidthWhileResizing(null);

  useEffect(() => {
    const onMessage = (event) => {
      if (token
        && event.origin === otusOrigin
        && event.source === iframeRef.current?.contentWindow
        && event.data?.type === OTUS_MESSAGE_TYPES.READY) {
        isFrameReadyRef.current = true;

        postConnect();
      }
    };

    // Otus repeats its ready message after each reload, so we keep listening.
    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [otusOrigin, postConnect, token]);

  // Pushes a renewed token; Otus drops it while signed in, so this is safe.
  useEffect(() => {
    if (isFrameReadyRef.current && token) postConnect();
  }, [postConnect, token]);

  return <div
    className={`${styles.otusTab} ${isActive ? styles.active : ''} ${isResizing ? styles.resizing : ''}`}
    id={panelId}
    style={customWidth ? { width } : undefined}
    >
    <Header onClose={onClose} onNewConversation={onNewConversation} onToggleRecent={onToggleRecent} />

    {hasBeenActivated && <>
      {isLoading && <LoadingOverlay />}

      <iframe
        allow="clipboard-write"
        className={styles.frame}
        onLoad={() => setIsLoading(false)}
        ref={iframeRef}
        src={embedUrl.href}
        title={t('iframeTitle')}
      />
    </>}

    {isMediumLayoutOrLarger && <div
      aria-controls={panelId}
      aria-label={t('resizeHandleLabel')}
      aria-orientation="vertical"
      aria-valuemax={calcMaxWidthPixels()}
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
  </div>;
};

export default memo(OtusTab);
