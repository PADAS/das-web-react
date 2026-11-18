import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { BREAKPOINTS, DAS_HOST, SIDEBAR_WIDTH_PIXELS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../../constants';
import { calcMaxAtlasTabWidth, clampAtlasTabWidth } from '../../utils/atlas';
import { fetchAtlasToken } from '../../ducks/atlas-token';
import { selectAtlasTabWidth } from '../../selectors/atlas';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import LoadingOverlay from '../../LoadingOverlay';

import Header from './Header';

import * as styles from './styles.module.scss';

const KEYBOARD_RESIZE_STEP_PIXELS = 16;

export const ATLAS_COMMANDS = { NEW_THREAD: 'new-thread', TOGGLE_THREADS: 'toggle-threads' };
// The Atlas app still uses its former name in these message types.
export const ATLAS_MESSAGE_TYPES = {
  COMMAND: 'otus:command',
  CONNECT: 'otus:connect',
  READY: 'otus:ready',
  THREADS: 'otus:threads',
};
// Longer than the 8 seconds Atlas itself waits for the token.
export const ATLAS_READY_TIMEOUT_MS = 10_000;

const WIDTH_BY_RESIZE_KEY = {
  ArrowLeft: (width) => width - KEYBOARD_RESIZE_STEP_PIXELS,
  ArrowRight: (width) => width + KEYBOARD_RESIZE_STEP_PIXELS,
  End: calcMaxAtlasTabWidth,
  Home: () => SIDEBAR_WIDTH_PIXELS,
};

const AtlasTab = ({ isActive, url }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.atlasTab' });

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const navigate = useNavigate();

  const atlasTabWidth = useSelector(selectAtlasTabWidth);

  const frameWrapperRef = useRef(null);
  const iframeRef = useRef(null);

  const panelId = useId();
  const titleId = useId();

  const [connectedFrameKey, setConnectedFrameKey] = useState(null);
  const [failedFrameKey, setFailedFrameKey] = useState(null);
  const [frameReloadCount, setFrameReloadCount] = useState(0);
  const [hasBeenActivated, setHasBeenActivated] = useState(isActive);
  const [loadedFrameKey, setLoadedFrameKey] = useState(null);
  const [recentOpenFrameKey, setRecentOpenFrameKey] = useState(null);
  const [widthWhileResizing, setWidthWhileResizing] = useState(null);

  // The frame boots a per-user sandbox, so it waits for the first visit.
  if (isActive && !hasBeenActivated) setHasBeenActivated(true);

  // The handle unmounts without a pointer up when the layout narrows mid-drag.
  if (!isMediumLayoutOrLarger && widthWhileResizing !== null) setWidthWhileResizing(null);

  const isResizing = widthWhileResizing !== null;
  const width = widthWhileResizing ?? atlasTabWidth;

  const embedUrl = new URL(url);
  embedUrl.searchParams.set('embed', '1');
  embedUrl.searchParams.set('titlebar', '0');

  const frameKey = `${frameReloadCount}-${embedUrl.href}`;
  const isLoading = loadedFrameKey !== frameKey;
  // A reloaded frame starts with Recent closed, so only its own message counts.
  const isRecentOpen = recentOpenFrameKey === frameKey;
  // A frame Atlas refuses still fires load, so only a connection proves it.
  const isWaitingForConnection = !isLoading && connectedFrameKey !== frameKey;
  const atlasOrigin = embedUrl.origin;
  // A late connection still clears the error, as the frame stays mounted behind it.
  const shouldShowLoadError = isWaitingForConnection && failedFrameKey === frameKey;

  const postCommand = useCallback((command) => {
    iframeRef.current?.contentWindow?.postMessage({ command, type: ATLAS_MESSAGE_TYPES.COMMAND }, atlasOrigin);
  }, [atlasOrigin]);

  // The retry button unmounts, so focus moves to the wrapper that outlives it.
  const onClickRetryButton = () => {
    frameWrapperRef.current.focus();

    setFrameReloadCount((reloadCount) => reloadCount + 1);
  };

  const onClose = useCallback(() => navigate('/'), [navigate]);

  const onKeyDownResizeHandle = (event) => {
    const calcWidth = WIDTH_BY_RESIZE_KEY[event.key];

    if (calcWidth) {
      event.preventDefault();

      dispatch(updateUserPreferences({ atlasTabWidth: clampAtlasTabWidth(calcWidth(width)) }));
    }
  };

  const onNewConversation = useCallback(() => postCommand(ATLAS_COMMANDS.NEW_THREAD), [postCommand]);

  // The cross-origin frame swallows the drag as soon as the pointer reaches it,
  // so the handle captures the pointer and the frame stops taking events.
  const onPointerDownResizeHandle = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    setWidthWhileResizing(width);
  };

  const onPointerMoveResizeHandle = (event) => {
    if (isResizing) setWidthWhileResizing(clampAtlasTabWidth(event.clientX - VERTICAL_NAV_RAIL_WIDTH_PIXELS));
  };

  // The width is only stored once the drag ends, since it is persisted.
  const onPointerUpResizeHandle = () => {
    if (isResizing) {
      dispatch(updateUserPreferences({ atlasTabWidth: widthWhileResizing }));

      setWidthWhileResizing(null);
    }
  };

  const onRevertResize = () => setWidthWhileResizing(null);

  const onToggleRecent = useCallback(() => postCommand(ATLAS_COMMANDS.TOGGLE_THREADS), [postCommand]);

  useEffect(() => {
    let latestAtlasTokenRequest = null;

    const connect = async () => {
      const atlasTokenRequest = dispatch(fetchAtlasToken());
      latestAtlasTokenRequest = atlasTokenRequest;

      // The duck already logs a failed request.
      const atlasToken = await atlasTokenRequest.catch(() => null);

      // A newer ready message, a reload or an unmount makes this result stale.
      if (atlasTokenRequest === latestAtlasTokenRequest) {
        if (atlasToken?.token) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              expires_at: atlasToken.expiresAt,
              site_url: DAS_HOST,
              token: atlasToken.token,
              type: ATLAS_MESSAGE_TYPES.CONNECT,
            },
            atlasOrigin
          );

          setConnectedFrameKey(frameKey);
        } else {
          setConnectedFrameKey(null);
          setFailedFrameKey(frameKey);
        }
      }
    };

    const onMessage = (event) => {
      if (event.origin === atlasOrigin && event.source === iframeRef.current?.contentWindow) {
        if (event.data?.type === ATLAS_MESSAGE_TYPES.READY) connect();

        if (event.data?.type === ATLAS_MESSAGE_TYPES.THREADS) {
          setRecentOpenFrameKey(event.data.open === true ? frameKey : null);
        }
      }
    };

    // Atlas repeats its ready message after each reload, so we keep listening.
    window.addEventListener('message', onMessage);

    return () => {
      latestAtlasTokenRequest = null;

      window.removeEventListener('message', onMessage);
    };
  }, [atlasOrigin, dispatch, frameKey]);

  useEffect(() => {
    if (isWaitingForConnection) {
      const timeoutId = setTimeout(() => setFailedFrameKey(frameKey), ATLAS_READY_TIMEOUT_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [frameKey, isWaitingForConnection]);

  return <section
    aria-labelledby={titleId}
    className={`${styles.atlasTab} ${isActive ? styles.active : ''} ${isResizing ? styles.resizing : ''}`}
    id={panelId}
    style={isMediumLayoutOrLarger ? { width } : undefined}
    >
    <Header
      isRecentOpen={isRecentOpen}
      onClose={onClose}
      onNewConversation={onNewConversation}
      onToggleRecent={onToggleRecent}
      titleId={titleId}
    />

    {hasBeenActivated && <div
      className={styles.frameWrapper}
      data-testid="atlasTab-frameWrapper"
      ref={frameWrapperRef}
      tabIndex={-1}
      >
      {shouldShowLoadError && <div className={styles.loadError} role="alert">
        <p>{t('loadErrorMessage')}</p>

        <Button
          onClick={onClickRetryButton}
          size="sm"
          type="button"
          variant="outline-secondary"
          >
          {t('retryButtonLabel')}
        </Button>
      </div>}

      {isLoading && <LoadingOverlay message={t('loadingMessage')} role="status" />}

      <iframe
        allow="clipboard-write"
        className={styles.frame}
        hidden={shouldShowLoadError}
        key={frameKey}
        onLoad={() => setLoadedFrameKey(frameKey)}
        ref={iframeRef}
        sandbox="allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        src={embedUrl.href}
        title={t('iframeTitle')}
      />
    </div>}

    {isMediumLayoutOrLarger && <div
      aria-controls={panelId}
      aria-label={t('resizeHandleLabel')}
      aria-orientation="vertical"
      aria-valuemax={calcMaxAtlasTabWidth()}
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

export default memo(AtlasTab);
