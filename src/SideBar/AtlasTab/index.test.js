import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  DAS_HOST,
  MIN_VISIBLE_MAP_WIDTH_PIXELS,
  SIDEBAR_WIDTH_PIXELS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';
import { act, fireEvent, render, screen } from '../../test-utils';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import AtlasTab, { ATLAS_READY_TIMEOUT_MS } from './';

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useMatchMedia: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

const ATLAS_URL = 'https://atlas.example.com';
const MAX_WIDTH = 1440 - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS;

describe('SideBar - AtlasTab', () => {
  let navigate, reduxStore, store, user;
  beforeEach(() => {
    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);
    useMatchMedia.mockImplementation(() => true);
    Element.prototype.setPointerCapture = jest.fn();
    window.innerWidth = 1440;
    user = userEvent.setup();

    store = {
      data: { token: { access_token: 'the-token' } },
      view: { userPreferences: {} },
    };
  });

  const atlasTabTree = (props = {}) => <Provider store={reduxStore}>
    <AtlasTab isActive url={ATLAS_URL} {...props} />
  </Provider>;

  const renderAtlasTab = (props = {}) => {
    reduxStore = mockStore(store);

    return render(atlasTabTree(props));
  };

  const getFrame = () => screen.getByTitle('Atlas chat');

  const getPanel = () => screen.getByRole('region', { name: 'Atlas' });

  const getResizeHandle = () => screen.getByRole('separator', { name: 'Resize Atlas panel' });

  const mockFramePostMessage = () => {
    const postMessage = jest.fn();
    getFrame().contentWindow.postMessage = postMessage;

    return postMessage;
  };

  const dispatchReadyMessage = (overrides = {}) => act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:ready' },
    origin: ATLAS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const dispatchThreadsMessage = (data, overrides = {}) => act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:threads', ...data },
    origin: ATLAS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const LOAD_ERROR_MESSAGE = 'Atlas couldn\'t load on this site. Try again, or contact support if this keeps happening.';

  const movePointerTo = (clientX) => user.pointer({ coords: { clientX }, target: getResizeHandle() });

  const pressResizeHandle = () => user.pointer({ keys: '[MouseLeft>]', target: getResizeHandle() });

  const releaseResizeHandle = () => user.pointer({ keys: '[/MouseLeft]', target: getResizeHandle() });

  test('loads the frame with the embed and titlebar query parameters', () => {
    renderAtlasTab();

    expect(getFrame()).toHaveAttribute('src', 'https://atlas.example.com/?embed=1&titlebar=0');
  });

  test('sandboxes the frame without letting it navigate the top window', () => {
    renderAtlasTab();

    expect(getFrame()).toHaveAttribute(
      'sandbox',
      'allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
    );
  });

  test('keeps a query string the configured url already carries', () => {
    renderAtlasTab({ url: 'https://atlas.example.com/chat?theme=dark' });

    expect(getFrame()).toHaveAttribute('src', 'https://atlas.example.com/chat?theme=dark&embed=1&titlebar=0');
  });

  test('does not load the frame until the tab is first activated', () => {
    renderAtlasTab({ isActive: false });

    expect(screen.queryByTitle('Atlas chat')).toBeNull();
  });

  test('loads the frame when the tab becomes active', () => {
    const { rerender } = renderAtlasTab({ isActive: false });

    rerender(atlasTabTree({ isActive: true }));

    expect(getFrame()).toBeInTheDocument();
  });

  test('keeps the frame mounted after the tab is deactivated again', () => {
    const { rerender } = renderAtlasTab();
    const frame = getFrame();

    rerender(atlasTabTree({ isActive: false }));

    expect(getFrame()).toBe(frame);
  });

  test('marks the wrapper as active when the tab is the current one', () => {
    renderAtlasTab();

    expect(getPanel()).toHaveClass('active');
  });

  test('does not mark the wrapper as active when the tab is not the current one', () => {
    const { rerender } = renderAtlasTab();

    rerender(atlasTabTree({ isActive: false }));

    expect(getPanel()).not.toHaveClass('active');
  });

  test('shows a loading message until the frame has loaded', () => {
    renderAtlasTab();

    expect(screen.getByRole('status')).toHaveTextContent('Loading Atlas…');

    fireEvent.load(getFrame());

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows the loading message again when the url changes', () => {
    const { rerender } = renderAtlasTab();
    fireEvent.load(getFrame());

    rerender(atlasTabTree({ url: 'https://atlas.example.com/other' }));

    expect(screen.getByRole('status')).toBeVisible();
  });

  test('shows the header before the frame has been loaded', () => {
    renderAtlasTab({ isActive: false });

    expect(screen.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close Atlas' })).toBeVisible();
  });

  test('closes the sidebar when the header close button is clicked', async () => {
    renderAtlasTab();

    await userEvent.click(screen.getByRole('button', { name: 'Close Atlas' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('posts the new thread command to the frame when the new conversation button is clicked', async () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    await userEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ command: 'new-thread', type: 'otus:command' }, ATLAS_URL);
  });

  test('posts the toggle threads command to the frame when the recent button is clicked', async () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    await userEvent.click(screen.getByRole('button', { name: 'Recent' }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ command: 'toggle-threads', type: 'otus:command' }, ATLAS_URL);
  });

  test('shows the recent button as pressed once the frame reports the recent conversations are open', () => {
    renderAtlasTab();

    dispatchThreadsMessage({ open: true });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows the recent button as not pressed once the frame reports the recent conversations are closed', () => {
    renderAtlasTab();
    dispatchThreadsMessage({ open: true });

    dispatchThreadsMessage({ open: false });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('ignores a recent conversations message that does not come from the frame origin', () => {
    renderAtlasTab();

    dispatchThreadsMessage({ open: true }, { origin: 'https://evil.example.com' });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('ignores a recent conversations message that does not come from the frame window', () => {
    renderAtlasTab();

    dispatchThreadsMessage({ open: true }, { source: window });

    expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('posts the site and token to the frame when it announces it is ready', () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { site_url: DAS_HOST, token: 'the-token', type: 'otus:connect' },
      ATLAS_URL
    );
  });

  test('posts the site and token again when the frame announces it is ready a second time', () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();
    dispatchReadyMessage();

    expect(postMessage).toHaveBeenCalledTimes(2);
  });

  test('posts the renewed token to the frame once it has connected', () => {
    const { rerender } = renderAtlasTab();
    const postMessage = mockFramePostMessage();
    dispatchReadyMessage();

    reduxStore = mockStore({ ...store, data: { token: { access_token: 'the-renewed-token' } } });
    rerender(atlasTabTree());

    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(postMessage).toHaveBeenLastCalledWith(
      { site_url: DAS_HOST, token: 'the-renewed-token', type: 'otus:connect' },
      ATLAS_URL
    );
  });

  test('does not post a renewed token to a frame that has not announced it is ready', () => {
    const { rerender } = renderAtlasTab();
    const postMessage = mockFramePostMessage();

    reduxStore = mockStore({ ...store, data: { token: { access_token: 'the-renewed-token' } } });
    rerender(atlasTabTree());

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from another origin', () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ origin: 'https://impostor.example.com' });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from a window other than the frame', () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ source: window });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores messages of other types', () => {
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ data: { type: 'otus:something-else' } });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('does not post to the frame when there is no token', () => {
    store.data.token = {};
    renderAtlasTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('stops listening once unmounted', () => {
    const { unmount } = renderAtlasTab();
    const postMessage = mockFramePostMessage();
    const frameWindow = getFrame().contentWindow;

    unmount();
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'otus:ready' },
      origin: ATLAS_URL,
      source: frameWindow,
    }));

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
      renderAtlasTab();
      fireEvent.load(getFrame());

      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
      expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
      expect(getFrame()).not.toBeVisible();
    });

    test('clears the load error when the frame announces it is ready late', () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);
      mockFramePostMessage();

      dispatchReadyMessage();

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeVisible();
    });

    test('does not show the load error when the frame announces it is ready before it loads', () => {
      renderAtlasTab();
      mockFramePostMessage();

      dispatchReadyMessage();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('does not show the load error before the wait runs out', () => {
      renderAtlasTab();
      fireEvent.load(getFrame());

      advanceTimersBy(ATLAS_READY_TIMEOUT_MS - 1);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeInTheDocument();
    });

    test('does not start the wait until the frame has loaded', () => {
      renderAtlasTab();

      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('does not show the load error when the frame announces it is ready in time', () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      mockFramePostMessage();

      dispatchReadyMessage();
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('does not show the load error when a ready frame has no token to receive', () => {
      store.data.token = {};
      renderAtlasTab();
      fireEvent.load(getFrame());

      dispatchReadyMessage();
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('shows the load error when the ready message comes from another origin', () => {
      renderAtlasTab();
      fireEvent.load(getFrame());

      dispatchReadyMessage({ origin: 'https://impostor.example.com' });
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('shows the load error when the ready message comes from a window other than the frame', () => {
      renderAtlasTab();
      fireEvent.load(getFrame());

      dispatchReadyMessage({ source: window });
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('reloads the frame when the user clicks try again', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toHaveAttribute('src', 'https://atlas.example.com/?embed=1&titlebar=0');
      expect(screen.getByRole('status')).toHaveTextContent('Loading Atlas…');
    });

    test('shows the recent button as not pressed once the user reloads the frame', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      dispatchThreadsMessage({ open: true });
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.getByRole('button', { name: 'Recent' })).toHaveAttribute('aria-pressed', 'false');
    });

    test('moves focus to the frame wrapper when the user clicks try again', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      await user.click(screen.getByRole('button', { name: 'Try again' }));

      expect(screen.getByTestId('atlasTab-frameWrapper')).toHaveFocus();
    });

    test('lets the user tab to try again when the reloaded frame times out too', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      await user.tab();

      expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
    });

    test('waits again for the reloaded frame to announce it is ready', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());

      advanceTimersBy(ATLAS_READY_TIMEOUT_MS - 1);

      expect(screen.queryByRole('alert')).toBeNull();

      advanceTimersBy(1);

      expect(screen.getByRole('alert')).toBeVisible();
    });

    test('keeps the reloaded frame once it announces it is ready', async () => {
      renderAtlasTab();
      fireEvent.load(getFrame());
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      fireEvent.load(getFrame());
      mockFramePostMessage();

      dispatchReadyMessage();
      advanceTimersBy(ATLAS_READY_TIMEOUT_MS);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(getFrame()).toBeInTheDocument();
    });

    test('stops waiting once unmounted', () => {
      const { unmount } = renderAtlasTab();
      fireEvent.load(getFrame());

      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });
  });

  test('applies the stored width to the panel', () => {
    store.view.userPreferences.atlasTabWidth = 700;
    renderAtlasTab();

    expect(getPanel()).toHaveStyle({ width: '700px' });
  });

  test('applies the default width to the panel when there is no stored width', () => {
    renderAtlasTab();

    expect(getPanel()).toHaveStyle({ width: '736px' });
  });

  test('clamps a stored width that no longer fits the viewport', () => {
    store.view.userPreferences.atlasTabWidth = 5000;
    renderAtlasTab();

    expect(getPanel()).toHaveStyle({ width: `${MAX_WIDTH}px` });
  });

  test('shows the width bounds of the panel in the resize handle', () => {
    renderAtlasTab();

    expect(getResizeHandle()).toHaveAttribute('aria-valuemin', `${SIDEBAR_WIDTH_PIXELS}`);
    expect(getResizeHandle()).toHaveAttribute('aria-valuenow', '736');
    expect(getResizeHandle()).toHaveAttribute('aria-valuemax', `${MAX_WIDTH}`);
  });

  test('shows the stored width as the current value of the resize handle', () => {
    store.view.userPreferences.atlasTabWidth = 700;
    renderAtlasTab();

    expect(getResizeHandle()).toHaveAttribute('aria-valuenow', '700');
  });

  test('widens the panel when the user presses the right arrow key on the resize handle', async () => {
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: 752 })]);
  });

  test('narrows the panel when the user presses the left arrow key on the resize handle', async () => {
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: 720 })]);
  });

  test('narrows the panel no further than its minimum width', async () => {
    store.view.userPreferences.atlasTabWidth = SIDEBAR_WIDTH_PIXELS + 8;
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: SIDEBAR_WIDTH_PIXELS })]);
  });

  test('narrows the panel to its minimum width when the user presses the home key on the resize handle', async () => {
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{Home}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: SIDEBAR_WIDTH_PIXELS })]);
  });

  test('widens the panel to its maximum width when the user presses the end key on the resize handle', async () => {
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{End}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: MAX_WIDTH })]);
  });

  test('ignores other keys pressed on the resize handle', async () => {
    renderAtlasTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(reduxStore.getActions()).toEqual([]);
  });

  test('persists the width when the user drags the resize handle', async () => {
    renderAtlasTab();

    await pressResizeHandle();
    await movePointerTo(870);
    await releaseResizeHandle();

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ atlasTabWidth: 800 })]);
  });

  test('shows the width being dragged before the pointer is released', async () => {
    renderAtlasTab();

    await pressResizeHandle();
    await movePointerTo(870);

    expect(getPanel()).toHaveStyle({ width: '800px' });
    expect(getPanel()).toHaveClass('resizing');
  });

  test('ignores pointer moves that do not follow a pointer down', async () => {
    renderAtlasTab();

    await movePointerTo(870);

    expect(reduxStore.getActions()).toEqual([]);
    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('drops an interrupted drag without persisting it', async () => {
    renderAtlasTab();

    await pressResizeHandle();
    await movePointerTo(870);
    fireEvent.pointerCancel(getResizeHandle());

    expect(reduxStore.getActions()).toEqual([]);
    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('drops an in-progress drag when the layout falls below medium', async () => {
    renderAtlasTab();

    await pressResizeHandle();
    await movePointerTo(870);
    useMatchMedia.mockImplementation(() => false);
    fireEvent.pointerMove(getResizeHandle(), { clientX: 880 });

    expect(getPanel()).not.toHaveClass('resizing');
  });

  test('does not show the resize handle on a small screen', () => {
    useMatchMedia.mockImplementation(() => false);
    renderAtlasTab();

    expect(screen.queryByRole('separator')).toBeNull();
  });

  test('does not apply the stored width on a small screen', () => {
    useMatchMedia.mockImplementation(() => false);
    store.view.userPreferences.atlasTabWidth = 700;
    renderAtlasTab();

    expect(getPanel()).not.toHaveAttribute('style');
  });
});
