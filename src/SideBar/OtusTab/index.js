import { memo, useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  ATLAS_MAP_ACTIONS,
  ATLAS_MAP_RECORD_TYPES,
  calcJumpCoordinatesForBbox,
  parseAtlasMapMessage,
} from '../../utils/atlas-map-messages';
import { ATLAS_TOKEN_SESSION_EXPIRING_ERROR_CODE, fetchAtlasToken } from '../../ducks/atlas-token';
import { BREAKPOINTS, DAS_HOST, SIDEBAR_WIDTH_PIXELS, TAB_KEYS, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../../constants';
import { calcMaxOtusTabWidth, clampOtusTabWidth } from '../../utils/otus';
import { clearAuth } from '../../ducks/auth';
import { parseAtlasAppMessage } from '../../utils/atlas-app-messages';
import { selectOtusTabWidth } from '../../selectors/otus';
import { updateUserPreferences } from '../../ducks/user-preferences';
import useAtlasAppActions from '../../hooks/useAtlasAppActions';
import useAtlasCameraHistory from '../../hooks/useAtlasCameraHistory';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import LoadingOverlay from '../../LoadingOverlay';

import Header from './Header';

import * as styles from './styles.module.scss';

const KEYBOARD_RESIZE_STEP_PIXELS = 16;

export const OTUS_COMMANDS = { NEW_THREAD: 'new-thread', TOGGLE_THREADS: 'toggle-threads' };
export const OTUS_MESSAGE_TYPES = {
  APP: 'otus:app',
  COMMAND: 'otus:command',
  CONNECT: 'otus:connect',
  MAP: 'otus:map',
  READY: 'otus:ready',
  THREADS: 'otus:threads',
};
// Longer than the 8 seconds Otus itself waits for the token.
export const OTUS_READY_TIMEOUT_MS = 10_000;

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
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const cameraHistory = useAtlasCameraHistory();
  const runAtlasAppAction = useAtlasAppActions(cameraHistory);

  const otusTabWidth = useSelector(selectOtusTabWidth);

  const frameWrapperRef = useRef(null);
  const iframeRef = useRef(null);
  // Steps of one Atlas reply arrive back to back, and app actions await routes
  // and data, so later steps wait for the ones before them.
  const pendingActionCountRef = useRef(0);
  const actionQueueRef = useRef(Promise.resolve());

  const panelId = useId();
  const titleId = useId();

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

  // An action starts at once when none is running, and otherwise after the last.
  const enqueueAction = (runAction) => {
    const startAction = () => {
      try {
        return Promise.resolve(runAction());
      } catch (error) {
        return Promise.reject(error);
      }
    };

    pendingActionCountRef.current += 1;

    actionQueueRef.current = (pendingActionCountRef.current === 1 ? startAction() : actionQueueRef.current.then(startAction))
      .catch((error) => console.warn('[otus:app] an Atlas action failed', error))
      .finally(() => {
        pendingActionCountRef.current -= 1;
      });
  };

  // Atlas moves of the camera are written into the browser history.
  const moveCameraWithHistory = (performMove) => cameraHistory.move(cameraHistory.begin(), performMove);

  const applyMapMessage = useEffectEvent((message) => {
    switch (message.action) {
    case ATLAS_MAP_ACTIONS.JUMP_TO:
      return moveCameraWithHistory(() => jumpToLocation(message.coordinates, message.zoom));

    case ATLAS_MAP_ACTIONS.FIT_BOUNDS:
      return moveCameraWithHistory(() => jumpToLocation(calcJumpCoordinatesForBbox(message.bbox)));

    case ATLAS_MAP_ACTIONS.OPEN_RECORD: {
      const tabKey = message.er_type === ATLAS_MAP_RECORD_TYPES.EVENT ? TAB_KEYS.EVENTS : TAB_KEYS.PATROLS;

      navigate(`/${tabKey}/${message.id}`);
      break;
    }

    default:
      break;
    }
  });

  const onMapMessage = useEffectEvent((data) => {
    const message = parseAtlasMapMessage(data);
    if (!message) {
      console.warn('Ignoring an invalid Atlas map message', data);

      return;
    }

    // Applied at once unless actions before it are still running.
    enqueueAction(() => applyMapMessage(message));
  });

  const onAppMessage = useEffectEvent((data) => {
    const message = parseAtlasAppMessage(data);
    if (!message) {
      console.warn('Ignoring an invalid Atlas app message', data);

      return;
    }

    enqueueAction(() => runAtlasAppAction(message));
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

        if (event.data?.type === OTUS_MESSAGE_TYPES.THREADS) {
          setRecentOpenFrameKey(event.data.open === true ? frameKey : null);
        }

        if (event.data?.type === OTUS_MESSAGE_TYPES.MAP) onMapMessage(event.data);

        if (event.data?.type === OTUS_MESSAGE_TYPES.APP) onAppMessage(event.data);
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
