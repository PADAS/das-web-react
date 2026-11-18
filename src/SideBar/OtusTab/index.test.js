import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  DAS_HOST,
  MIN_VISIBLE_MAP_WIDTH_PIXELS,
  SIDEBAR_WIDTH_PIXELS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { act, fireEvent, render, screen } from '../../test-utils';
import { fetchAtlasToken } from '../../ducks/atlas-token';
import { mockStore } from '../../__test-helpers/MockStore';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import OtusTab, { OTUS_READY_TIMEOUT_MS } from './';

jest.mock('../../ducks/atlas-token', () => ({
  ...jest.requireActual('../../ducks/atlas-token'),
  fetchAtlasToken: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useMatchMedia: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

const ATLAS_TOKEN = { expiresAt: '2026-11-18T20:00:00Z', expiresIn: 28800, token: 'the-atlas-token' };
const OTUS_URL = 'https://otus.example.com';
const MAX_WIDTH = 1440 - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS;

describe('SideBar - OtusTab', () => {
  let navigate, reduxStore, store, user;
  beforeEach(() => {
    fetchAtlasToken.mockImplementation(() => () => Promise.resolve(ATLAS_TOKEN));
    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);
    useMatchMedia.mockImplementation(() => true);
    Element.prototype.setPointerCapture = jest.fn();
    window.innerWidth = 1440;
    user = userEvent.setup();

    store = {
      data: { token: { access_token: 'the-user-token' } },
      view: { userPreferences: {} },
    };
  });

  const otusTabTree = (props = {}) => <Provider store={reduxStore}>
    <OtusTab isActive url={OTUS_URL} {...props} />
  </Provider>;

  const renderOtusTab = (props = {}) => {
    reduxStore = mockStore(store);

    return render(otusTabTree(props));
  };

  const getFrame = () => screen.getByTitle('Atlas chat');

  const getPanel = () => screen.getByRole('region', { name: 'Atlas' });

  const getResizeHandle = () => screen.getByRole('separator', { name: 'Resize Atlas panel' });

  const mockFramePostMessage = () => {
    const postMessage = jest.fn();
    getFrame().contentWindow.postMessage = postMessage;

    return postMessage;
  };

  const deferAtlasToken = () => {
    const atlasTokenRequest = {};
    fetchAtlasToken.mockImplementationOnce(() => () => new Promise((resolve, reject) => {
      atlasTokenRequest.reject = () => act(async () => reject(new Error('Request failed')));
      atlasTokenRequest.resolve = (atlasToken) => act(async () => resolve(atlasToken));
    }));

    return atlasTokenRequest;
  };

  const rejectAtlasTokenRequests = () => fetchAtlasToken.mockImplementation(
    () => () => Promise.reject(new Error('Request failed'))
  );

  const dispatchReadyMessage = (overrides = {}) => act(async () => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:ready' },
    origin: OTUS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const dispatchThreadsMessage = (data, overrides = {}) => act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:threads', ...data },
    origin: OTUS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const connectMessage = (atlasToken = ATLAS_TOKEN) => [
    { expires_at: atlasToken.expiresAt, site_url: DAS_HOST, token: atlasToken.token, type: 'otus:connect' },
    OTUS_URL,
  ];

  const LOAD_ERROR_MESSAGE = 'Atlas couldn\'t load on this site. Try again, or contact support if this keeps happening.';

  const movePointerTo = (clientX) => user.pointer({ coords: { clientX }, target: getResizeHandle() });

  const pressResizeHandle = () => user.pointer({ keys: '[MouseLeft>]', target: getResizeHandle() });

  const releaseResizeHandle = () => user.pointer({ keys: '[/MouseLeft]', target: getResizeHandle() });

  test('loads the frame with the embed and titlebar query parameters', () => {
    renderOtusTab();

    expect(getFrame()).toHaveAttribute('src', 'https://otus.example.com/?embed=1&titlebar=0');
  });

  test('sandboxes the frame without letting it navigate the top window', () => {
    renderOtusTab();

    expect(getFrame()).toHaveAttribute(
      'sandbox',
      'allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
    );
  });

  test('keeps a query string the configured url already carries', () => {
    renderOtusTab({ url: 'https://otus.example.com/chat?theme=dark' });

    expect(getFrame()).toHaveAttribute('src', 'https://otus.example.com/chat?theme=dark&embed=1&titlebar=0');
  });

  test('does not load the frame until the tab is first activated', () => {
    renderOtusTab({ isActive: false });

    expect(screen.queryByTitle('Atlas chat')).toBeNull();
  });

  test('loads the frame when the tab becomes active', () => {
    const { rerender } = renderOtusTab({ isActive: false });

    rerender(otusTabTree({ isActive: true }));

    expect(getFrame()).toBeInTheDocument();
  });

  test('keeps the frame mounted after the tab is deactivated again', () => {
    const { rerender } = renderOtusTab();
    const frame = getFrame();

    rerender(otusTabTree({ isActive: false }));

    expect(getFrame()).toBe(frame);
  });

  test('marks the wrapper as active when the tab is the current one', () => {
    renderOtusTab();

    expect(getPanel()).toHaveClass('active');
  });

  test('does not mark the wrapper as active when the tab is not the current one', () => {
    const { rerender } = renderOtusTab();

    rerender(otusTabTree({ isActive: false }));

    expect(getPanel()).not.toHaveClass('active');
  });

  test('shows a loading message until the frame has loaded', () => {
    renderOtusTab();

    expect(screen.getByRole('status')).toHaveTextContent('Loading Atlas…');

    fireEvent.load(getFrame());

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows the loading message again when the url changes', () => {
    const { rerender } = renderOtusTab();
    fireEvent.load(getFrame());

    rerender(otusTabTree({ url: 'https://otus.example.com/other' }));

    expect(screen.getByRole('status')).toBeVisible();
  });

  test('shows the header before the frame has been loaded', () => {
    renderOtusTab({ isActive: false });

    expect(screen.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close Atlas' })).toBeVisible();
  });

  test('closes the sidebar when the header close button is clicked', async () => {
    renderOtusTab();

    await userEvent.click(screen.getByRole('button', { name: 'Close Atlas' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('posts the new thread command to the frame when the new conversation button is clicked', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await userEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ command: 'new-thread', type: 'otus:command' }, OTUS_URL);
  });

  test('posts the toggle threads command to the frame when the recent button is clicked', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await userEvent.click(screen.getByRole('button', { name: 'Recent' }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ command: 'toggle-threads', type: 'otus:command' }, OTUS_URL);
  });

  test('shows the recent button as pressed once the frame reports the recent conversations are open', () => {
    renderOtusTab();

    dispatchThreadsMessage({ open: true });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows the recent button as not pressed once the frame reports the recent conversations are closed', () => {
    renderOtusTab();
    dispatchThreadsMessage({ open: true });

    dispatchThreadsMessage({ open: false });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('ignores a recent conversations message that does not come from the frame origin', () => {
    renderOtusTab();

    dispatchThreadsMessage({ open: true }, { origin: 'https://evil.example.com' });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('ignores a recent conversations message that does not come from the frame window', () => {
    renderOtusTab();

    dispatchThreadsMessage({ open: true }, { source: window });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('requests an Atlas token when the frame announces it is ready', async () => {
    renderOtusTab();
    mockFramePostMessage();

    await dispatchReadyMessage();

    expect(fetchAtlasToken).toHaveBeenCalledTimes(1);
  });

  test('posts the site, the Atlas token and its expiry to the frame once the token arrives', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(...connectMessage());
  });

  test('does not post to the frame while the Atlas token request runs', async () => {
    deferAtlasToken();
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(fetchAtlasToken).toHaveBeenCalledTimes(1);
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('requests and posts a new Atlas token, never the user token, each time the frame is ready', async () => {
    const otherAtlasToken = { ...ATLAS_TOKEN, expiresAt: '2026-11-18T21:00:00Z', token: 'the-other-atlas-token' };
    fetchAtlasToken
      .mockImplementationOnce(() => () => Promise.resolve(ATLAS_TOKEN))
      .mockImplementationOnce(() => () => Promise.resolve(otherAtlasToken));
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();
    await dispatchReadyMessage();

    expect(fetchAtlasToken).toHaveBeenCalledTimes(2);
    expect(postMessage.mock.calls).toEqual([connectMessage(), connectMessage(otherAtlasToken)]);
  });

  test('does not post to the frame when the Atlas token request fails', async () => {
    rejectAtlasTokenRequests();
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('requests a new Atlas token when the frame is ready again after a failed request', async () => {
    fetchAtlasToken.mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();
    await dispatchReadyMessage();

    expect(fetchAtlasToken).toHaveBeenCalledTimes(2);
    expect(postMessage.mock.calls).toEqual([connectMessage()]);
  });

  test('shows the load error in place of the frame when the Atlas token request fails', async () => {
    rejectAtlasTokenRequests();
    renderOtusTab();
    fireEvent.load(getFrame());

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(getFrame()).not.toBeVisible();
  });

  test('shows the load error instead of posting when the Atlas token response has no token', async () => {
    fetchAtlasToken.mockImplementation(() => () => Promise.resolve({ ...ATLAS_TOKEN, token: undefined }));
    renderOtusTab();
    fireEvent.load(getFrame());
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(postMessage).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeVisible();
  });

  test('shows the load error when a new Atlas token request fails after the frame connected', async () => {
    fetchAtlasToken
      .mockImplementationOnce(() => () => Promise.resolve(ATLAS_TOKEN))
      .mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
    renderOtusTab();
    fireEvent.load(getFrame());
    mockFramePostMessage();
    await dispatchReadyMessage();

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toBeVisible();
    expect(getFrame()).not.toBeVisible();
  });

  test('waits for the frame to load before showing the load error for a failed Atlas token request', async () => {
    rejectAtlasTokenRequests();
    renderOtusTab();

    await dispatchReadyMessage();

    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.load(getFrame());

    expect(screen.getByRole('alert')).toBeVisible();
  });

  test('requests and posts a new Atlas token when the user tries again after a failed request', async () => {
    fetchAtlasToken.mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
    renderOtusTab();
    fireEvent.load(getFrame());
    await dispatchReadyMessage();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.load(getFrame());
    const postMessage = mockFramePostMessage();
    await dispatchReadyMessage();

    expect(fetchAtlasToken).toHaveBeenCalledTimes(2);
    expect(postMessage.mock.calls).toEqual([connectMessage()]);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('does not post to the frame again when the user token is renewed', async () => {
    const { rerender } = renderOtusTab();
    const postMessage = mockFramePostMessage();
    await dispatchReadyMessage();

    reduxStore = mockStore({ ...store, data: { token: { access_token: 'the-renewed-user-token' } } });
    rerender(otusTabTree());

    expect(fetchAtlasToken).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  test('ignores an Atlas token that arrives after a newer ready message', async () => {
    const firstAtlasTokenRequest = deferAtlasToken();
    renderOtusTab();
    const postMessage = mockFramePostMessage();
    await dispatchReadyMessage();
    await dispatchReadyMessage();

    await firstAtlasTokenRequest.resolve({ ...ATLAS_TOKEN, token: 'the-stale-atlas-token' });

    expect(postMessage.mock.calls).toEqual([connectMessage()]);
  });

  test('ignores a failed Atlas token request that settles after a newer ready message', async () => {
    const firstAtlasTokenRequest = deferAtlasToken();
    deferAtlasToken();
    renderOtusTab();
    fireEvent.load(getFrame());
    await dispatchReadyMessage();
    await dispatchReadyMessage();

    await firstAtlasTokenRequest.reject();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(getFrame()).toBeVisible();
  });

  test('ignores an Atlas token that arrives after the frame reloads', async () => {
    const atlasTokenRequest = deferAtlasToken();
    const { rerender } = renderOtusTab();
    const postMessage = mockFramePostMessage();
    await dispatchReadyMessage();

    rerender(otusTabTree({ url: 'https://otus.example.com/other' }));
    const reloadedFramePostMessage = mockFramePostMessage();
    await atlasTokenRequest.resolve(ATLAS_TOKEN);

    expect(postMessage).not.toHaveBeenCalled();
    expect(reloadedFramePostMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from another origin', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage({ origin: 'https://impostor.example.com' });

    expect(fetchAtlasToken).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from a window other than the frame', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage({ source: window });

    expect(fetchAtlasToken).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores messages of other types', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage({ data: { type: 'otus:something-else' } });

    expect(fetchAtlasToken).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('stops listening once unmounted', () => {
    const { unmount } = renderOtusTab();
    const postMessage = mockFramePostMessage();
    const frameWindow = getFrame().contentWindow;

    unmount();
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'otus:ready' },
      origin: OTUS_URL,
      source: frameWindow,
    }));

    expect(fetchAtlasToken).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
  });

  describe('when the frame does not announce it is ready', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const advanceTimersBy = (milliseconds) => act(() => jest.advanceTimersByTime(milliseconds));

    test('shows the load error in place of the frame once the wait runs out', () => {
      renderOtusTab();
      fireEvent.load(getFrame());

      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
      expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
      expect(getFrame()).not.toBeVisible();
    });

    test('clears the load error when the frame announces it is ready late', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);
      mockFramePostMessage();

      await dispatchReadyMessage();

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeVisible();
    });

    test('does not show the load error when the frame announces it is ready before it loads', async () => {
      renderOtusTab();
      mockFramePostMessage();

      await dispatchReadyMessage();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('does not show the load error before the wait runs out', () => {
      renderOtusTab();
      fireEvent.load(getFrame());

      advanceTimersBy(OTUS_READY_TIMEOUT_MS - 1);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeInTheDocument();
    });

    test('does not start the wait until the frame has loaded', () => {
      renderOtusTab();

      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('does not show the load error when the frame announces it is ready in time', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      mockFramePostMessage();

      await dispatchReadyMessage();
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('shows the load error when the ready message comes from another origin', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());

      await dispatchReadyMessage({ origin: 'https://impostor.example.com' });
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('shows the load error when the ready message comes from a window other than the frame', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());

      await dispatchReadyMessage({ source: window });
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('reloads the frame when the user clicks try again', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toHaveAttribute('src', 'https://otus.example.com/?embed=1&titlebar=0');
      expect(screen.getByRole('status')).toHaveTextContent('Loading Atlas…');
    });

    test('shows the recent button as not pressed once the user reloads the frame', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      dispatchThreadsMessage({ open: true });
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
    });

    test('moves focus to the frame wrapper when the user clicks try again', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.getByTestId('otusTab-frameWrapper')).toHaveFocus();
    });

    test('lets the user tab to try again when the reloaded frame times out too', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      await user.tab();

      expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
    });

    test('waits again for the reloaded frame to announce it is ready', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());

      advanceTimersBy(OTUS_READY_TIMEOUT_MS - 1);

      expect(screen.queryByRole('alert')).toBeNull();

      advanceTimersBy(1);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('keeps the reloaded frame once it announces it is ready', async () => {
      renderOtusTab();
      fireEvent.load(getFrame());
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());
      mockFramePostMessage();

      await dispatchReadyMessage();
      advanceTimersBy(OTUS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeInTheDocument();
    });

    test('stops waiting once unmounted', () => {
      const { unmount } = renderOtusTab();
      fireEvent.load(getFrame());

      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });
  });

  test('applies the stored width to the panel', () => {
    store.view.userPreferences.otusTabWidth = 700;
    renderOtusTab();

    expect(getPanel()).toHaveStyle({ width: '700px' });
  });

  test('applies the default width to the panel when there is no stored width', () => {
    renderOtusTab();

    expect(getPanel()).toHaveStyle({ width: '736px' });
  });

  test('clamps a stored width that no longer fits the viewport', () => {
    store.view.userPreferences.otusTabWidth = 5000;
    renderOtusTab();

    expect(getPanel()).toHaveStyle({ width: `${MAX_WIDTH}px` });
  });

  test('shows the width bounds of the panel in the resize handle', () => {
    renderOtusTab();

    expect(getResizeHandle()).toHaveAttribute('aria-valuemin', `${SIDEBAR_WIDTH_PIXELS}`);
    expect(getResizeHandle()).toHaveAttribute('aria-valuenow', '736');
    expect(getResizeHandle()).toHaveAttribute('aria-valuemax', `${MAX_WIDTH}`);
  });

  test('shows the stored width as the current value of the resize handle', () => {
    store.view.userPreferences.otusTabWidth = 700;
    renderOtusTab();

    expect(getResizeHandle()).toHaveAttribute('aria-valuenow', '700');
  });

  test('widens the panel when the user presses the right arrow key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: 752 })]);
  });

  test('narrows the panel when the user presses the left arrow key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: 720 })]);
  });

  test('narrows the panel no further than its minimum width', async () => {
    store.view.userPreferences.otusTabWidth = SIDEBAR_WIDTH_PIXELS + 8;
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: SIDEBAR_WIDTH_PIXELS })]);
  });

  test('narrows the panel to its minimum width when the user presses the home key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{Home}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: SIDEBAR_WIDTH_PIXELS })]);
  });

  test('widens the panel to its maximum width when the user presses the end key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{End}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: MAX_WIDTH })]);
  });

  test('ignores other keys pressed on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(reduxStore.getActions()).toEqual([]);
  });

  test('persists the width when the user drags the resize handle', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);
    await releaseResizeHandle();

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: 800 })]);
  });

  test('shows the width being dragged before the pointer is released', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);

    expect(getPanel()).toHaveStyle({ width: '800px' });
    expect(getPanel()).toHaveClass('resizing');
  });

  test('ignores pointer moves that do not follow a pointer down', async () => {
    renderOtusTab();

    await movePointerTo(870);

    expect(reduxStore.getActions()).toEqual([]);
    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('drops an interrupted drag without persisting it', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);
    fireEvent.pointerCancel(getResizeHandle());

    expect(reduxStore.getActions()).toEqual([]);
    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('drops an in-progress drag when the layout falls below medium', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);
    useMatchMedia.mockImplementation(() => false);
    fireEvent.pointerMove(getResizeHandle(), { clientX: 880 });

    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('does not show the resize handle on a small screen', () => {
    useMatchMedia.mockImplementation(() => false);
    renderOtusTab();

    expect(screen.queryByRole('separator')).toBeNull();
  });

  test('does not apply the stored width on a small screen', () => {
    useMatchMedia.mockImplementation(() => false);
    store.view.userPreferences.otusTabWidth = 700;
    renderOtusTab();

    expect(getPanel()).not.toHaveAttribute('style');
  });
});
