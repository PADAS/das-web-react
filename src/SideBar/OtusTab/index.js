import { memo, useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ATLAS_TOKEN_SESSION_EXPIRING_ERROR_CODE, fetchAtlasToken } from '../../ducks/atlas-token';
import {
  BREAKPOINTS,
  CLIENT_BUILD_VERSION,
  DAS_HOST,
  SIDEBAR_WIDTH_PIXELS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { ATLAS_TOOL_NAMES, ATLAS_TOOLS, ATLAS_TOOLS_VERSION } from '../../utils/atlas-tools/validate';
import { calcMaxOtusTabWidth, clampOtusTabWidth } from '../../utils/otus';
import { clearAuth } from '../../ducks/auth';
import { selectOtusTabWidth } from '../../selectors/otus';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { JSON_RPC_ERROR_CODES, useAtlasTools } from '../../AtlasTools';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import LoadingOverlay from '../../LoadingOverlay';

import Header from './Header';

import * as styles from './styles.module.scss';

const KEYBOARD_RESIZE_STEP_PIXELS = 16;

export const OTUS_COMMANDS = { NEW_THREAD: 'new-thread', TOGGLE_THREADS: 'toggle-threads' };
export const OTUS_MESSAGE_TYPES = {
  BOOTING: 'otus:booting',
  COMMAND: 'otus:command',
  CONNECT: 'otus:connect',
  MCP: 'otus:mcp',
  READY: 'otus:ready',
  THREADS: 'otus:threads',
};
// Longer than the 8 seconds Otus itself waits for the token.
export const OTUS_READY_TIMEOUT_MS = 10_000;

// The tools this client offers, so Atlas need not list them before connecting.
const ATLAS_TOOLS_SUMMARY = { names: ATLAS_TOOL_NAMES, version: ATLAS_TOOLS_VERSION };

// MCP progress tokens take the same values.
const isJsonRpcId = (id) => typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));

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
  const { callTool } = useAtlasTools();

  const otusTabWidth = useSelector(selectOtusTabWidth);

  const frameWrapperRef = useRef(null);
  const iframeRef = useRef(null);

  const panelId = useId();
  const titleId = useId();

  const [bootingFrameKey, setBootingFrameKey] = useState(null);
  const [connectedFrameKey, setConnectedFrameKey] = useState(null);
  const [failedFrameKey, setFailedFrameKey] = useState(null);
  const [frameReloadCount, setFrameReloadCount] = useState(0);
  const [hasBeenActivated, setHasBeenActivated] = useState(isActive);
  const [loadedFrameKey, setLoadedFrameKey] = useState(null);
  const [recentOpenFrameKey, setRecentOpenFrameKey] = useState(null);
  const [sessionExpiringFrameKey, setSessionExpiringFrameKey] = useState(null);
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

  const frameKey = `${frameReloadCount}-${embedUrl.href}`;
  const isLoading = loadedFrameKey !== frameKey;
  // A reloaded frame starts with Recent closed, so only its own message counts.
  const isRecentOpen = recentOpenFrameKey === frameKey;
  // Atlas's sandbox is starting, so a new conversation has no session to start in.
  const isBooting = bootingFrameKey === frameKey;
  const isSessionExpiring = sessionExpiringFrameKey === frameKey;
  // A frame Otus refuses still fires load, so only a connection proves it.
  const isWaitingForConnection = !isLoading && connectedFrameKey !== frameKey;
  const otusOrigin = embedUrl.origin;
  // A late connection still clears the error, as the frame stays mounted behind it.
  const shouldShowConnectionError = isWaitingForConnection && failedFrameKey === frameKey;
  const shouldShowLoadError = shouldShowConnectionError && !isSessionExpiring;
  const shouldShowLogInPrompt = shouldShowConnectionError && isSessionExpiring;

  const postCommand = useCallback((command) => {
    iframeRef.current?.contentWindow?.postMessage({ command, type: OTUS_MESSAGE_TYPES.COMMAND }, otusOrigin);
  }, [otusOrigin]);

  // The retry button unmounts, so focus moves to the wrapper that outlives it.
  const onClickRetryButton = () => {
    frameWrapperRef.current.focus();

    setFrameReloadCount((reloadCount) => reloadCount + 1);
  };

  // Without a token, the app's guard sends the user to log in and back here.
  const onClickLogInButton = () => dispatch(clearAuth());

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

  const callToolForFrame = async (params, postToFrame) => {
    if (typeof params !== 'object' || params === null || Array.isArray(params)) {
      return { error: { code: JSON_RPC_ERROR_CODES.INVALID_PARAMS, message: 'tools/call needs params' } };
    }

    const { _meta: meta, arguments: args, name } = params;
    if (meta?.batch !== undefined && typeof meta.batch !== 'string') {
      return { error: { code: JSON_RPC_ERROR_CODES.INVALID_PARAMS, message: '_meta.batch must be a string' } };
    }

    // The frame is told when a call leaves the queue, so it can tell waiting from stuck.
    const progressToken = meta?.progressToken;
    const onStart = isJsonRpcId(progressToken)
      ? () => postToFrame({
        method: 'notifications/progress',
        params: { message: 'started', progress: 0, progressToken },
      })
      : undefined;

    try {
      return { result: await callTool(name, args, { batch: meta?.batch, onStart }) };
    } catch (error) {
      return {
        error: {
          code: error?.code ?? JSON_RPC_ERROR_CODES.INVALID_PARAMS,
          message: error?.message ?? String(error),
        },
      };
    }
  };

  // Atlas calls the app's tools as an MCP client would, over JSON-RPC. The
  // reply goes to the window that asked, even if the frame reloaded since.
  const onMcpMessage = useEffectEvent(async (data, frameWindow) => {
    if (data.jsonrpc !== '2.0' || !isJsonRpcId(data.id)) {
      console.warn('Ignoring a malformed Atlas MCP message', data);

      return;
    }

    const targetOrigin = otusOrigin;
    const postToFrame = (message) => frameWindow.postMessage(
      { type: OTUS_MESSAGE_TYPES.MCP, jsonrpc: '2.0', ...message },
      targetOrigin
    );

    let reply;
    if (data.method === 'tools/list') {
      reply = { result: { _meta: { contractVersion: ATLAS_TOOLS_VERSION }, tools: ATLAS_TOOLS } };
    } else if (data.method === 'tools/call') {
      reply = await callToolForFrame(data.params, postToFrame);
    } else {
      reply = { error: { code: JSON_RPC_ERROR_CODES.METHOD_NOT_FOUND, message: `Method not found: ${data.method}` } };
    }

    postToFrame({ id: data.id, ...reply });
  });

  useEffect(() => {
    let latestAtlasTokenRequest = null;

    const connect = async () => {
      const atlasTokenRequest = dispatch(fetchAtlasToken());
      latestAtlasTokenRequest = atlasTokenRequest;

      let atlasToken = null;
      let isSessionExpiringError = false;

      try {
        atlasToken = await atlasTokenRequest;
      } catch (error) {
        // The duck already logs a failed request.
        isSessionExpiringError = error.response?.data?.code === ATLAS_TOKEN_SESSION_EXPIRING_ERROR_CODE;
      }

      // A newer ready message, a reload or an unmount makes this result stale.
      if (atlasTokenRequest === latestAtlasTokenRequest) {
        if (atlasToken?.token) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              atlas_tools: ATLAS_TOOLS_SUMMARY,
              // This build's version, so Atlas only offers to drive what this client can do.
              client_version: CLIENT_BUILD_VERSION,
              expires_at: atlasToken.expiresAt,
              site_url: DAS_HOST,
              token: atlasToken.token,
              type: OTUS_MESSAGE_TYPES.CONNECT,
            },
            otusOrigin
          );

          setConnectedFrameKey(frameKey);
          setSessionExpiringFrameKey(null);
        } else {
          setConnectedFrameKey(null);
          setFailedFrameKey(frameKey);

          // Only an Atlas token clears the prompt, as retrying cannot renew the session.
          if (isSessionExpiringError) setSessionExpiringFrameKey(frameKey);
        }
      }
    };

    const onMessage = (event) => {
      if (event.origin === otusOrigin && event.source === iframeRef.current?.contentWindow) {
        if (event.data?.type === OTUS_MESSAGE_TYPES.READY) connect();

        if (event.data?.type === OTUS_MESSAGE_TYPES.BOOTING) {
          setBootingFrameKey(event.data.booting === true ? frameKey : null);
        }

        if (event.data?.type === OTUS_MESSAGE_TYPES.THREADS) {
          setRecentOpenFrameKey(event.data.open === true ? frameKey : null);
        }

        if (event.data?.type === OTUS_MESSAGE_TYPES.MCP) onMcpMessage(event.data, event.source);
      }
    };

    // Otus repeats its ready message after each reload, so we keep listening.
    window.addEventListener('message', onMessage);

    return () => {
      latestAtlasTokenRequest = null;

      window.removeEventListener('message', onMessage);
    };
  }, [dispatch, frameKey, otusOrigin]);

  useEffect(() => {
    if (isWaitingForConnection) {
      const timeoutId = setTimeout(() => setFailedFrameKey(frameKey), OTUS_READY_TIMEOUT_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [frameKey, isWaitingForConnection]);

  return <section
    aria-labelledby={titleId}
    className={`${styles.otusTab} ${isActive ? styles.active : ''} ${isResizing ? styles.resizing : ''}`}
    id={panelId}
    style={isMediumLayoutOrLarger ? { width } : undefined}
    >
    <Header
      isBooting={isBooting}
      isRecentOpen={isRecentOpen}
      onClose={onClose}
      onNewConversation={onNewConversation}
      onToggleRecent={onToggleRecent}
      titleId={titleId}
    />

    {hasBeenActivated && <div
      className={styles.frameWrapper}
      data-testid="otusTab-frameWrapper"
      ref={frameWrapperRef}
      tabIndex={-1}
      >
      {shouldShowLoadError && <div className={styles.connectionError} role="alert">
        <p>{t('loadErrorMessage')}</p>

        <button className={styles.connectionErrorButton} onClick={onClickRetryButton} type="button">
          {t('retryButtonLabel')}
        </button>
      </div>}

      {shouldShowLogInPrompt && <div className={styles.connectionError} role="alert">
        <p>{t('sessionExpiringMessage')}</p>

        <button className={styles.connectionErrorButton} onClick={onClickLogInButton} type="button">
          {t('logInButtonLabel')}
        </button>
      </div>}

      {isLoading && <LoadingOverlay message={t('loadingMessage')} role="status" />}

      <iframe
        allow="clipboard-write"
        className={styles.frame}
        hidden={shouldShowConnectionError}
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
