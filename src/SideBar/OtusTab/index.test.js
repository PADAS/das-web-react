import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DAS_HOST, VERTICAL_NAV_RAIL_WIDTH_PIXELS } from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';
import { fireEvent, render, screen } from '../../test-utils';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import OtusTab from './';

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useMatchMedia: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

const OTUS_URL = 'https://otus.example.com';

describe('SideBar - OtusTab', () => {
  let navigate, reduxStore, store, user;
  beforeEach(() => {
    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);
    useMatchMedia.mockImplementation(() => true);
    Element.prototype.setPointerCapture = jest.fn();
    user = userEvent.setup();

    store = {
      data: { token: { access_token: 'the-token' } },
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

  const getFrame = () => screen.getByTitle('Otus chat');

  const getResizeHandle = () => screen.getByRole('separator', { name: 'Resize Otus panel' });

  const mockFramePostMessage = () => {
    const postMessage = jest.fn();
    getFrame().contentWindow.postMessage = postMessage;

    return postMessage;
  };

  const dispatchReadyMessage = (overrides = {}) => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:ready' },
    origin: OTUS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  }));

  const renewToken = (rerender) => {
    reduxStore = mockStore({ ...store, data: { token: { access_token: 'renewed-token' } } });

    rerender(otusTabTree());
  };

  const movePointerTo = (clientX) => user.pointer({ coords: { clientX }, target: getResizeHandle() });

  const pressResizeHandle = () => user.pointer({ keys: '[MouseLeft>]', target: getResizeHandle() });

  const releaseResizeHandle = () => user.pointer({ keys: '[/MouseLeft]', target: getResizeHandle() });

  test('loads the frame with the embed and titlebar query parameters', () => {
    renderOtusTab();

    expect(getFrame()).toHaveAttribute('src', 'https://otus.example.com/?embed=1&titlebar=0');
  });

  test('keeps a query string the configured url already carries', () => {
    renderOtusTab({ url: 'https://otus.example.com/chat?theme=dark' });

    expect(getFrame()).toHaveAttribute('src', 'https://otus.example.com/chat?theme=dark&embed=1&titlebar=0');
  });

  test('does not load the frame until the tab is first activated', () => {
    renderOtusTab({ isActive: false });

    expect(screen.queryByTitle('Otus chat')).toBeNull();
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

    expect(getFrame().parentElement).toHaveClass('active');
  });

  test('does not mark the wrapper as active when the tab is not the current one', () => {
    const { rerender } = renderOtusTab();

    rerender(otusTabTree({ isActive: false }));

    expect(getFrame().parentElement).not.toHaveClass('active');
  });

  test('shows the header before the frame has been loaded', () => {
    renderOtusTab({ isActive: false });

    expect(screen.getByRole('heading', { name: 'Otus' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close Otus' })).toBeVisible();
  });

  test('closes the sidebar when the header close button is clicked', async () => {
    renderOtusTab();

    await userEvent.click(screen.getByRole('button', { name: 'Close Otus' }));

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

  test('posts the site and token to the frame when it announces it is ready', () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { site_url: DAS_HOST, token: 'the-token', type: 'otus:connect' },
      OTUS_URL
    );
  });

  test('posts the site and token again when the frame announces it is ready a second time', () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();
    dispatchReadyMessage();

    expect(postMessage).toHaveBeenCalledTimes(2);
  });

  test('posts the renewed token to the frame once it is ready', () => {
    const { rerender } = renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();
    renewToken(rerender);

    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(postMessage).toHaveBeenLastCalledWith(
      { site_url: DAS_HOST, token: 'renewed-token', type: 'otus:connect' },
      OTUS_URL
    );
  });

  test('does not post a renewed token before the frame is ready', () => {
    const { rerender } = renderOtusTab();
    const postMessage = mockFramePostMessage();

    renewToken(rerender);

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from another origin', () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ origin: 'https://impostor.example.com' });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores a ready message from a window other than the frame', () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ source: window });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('ignores messages of other types', () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage({ data: { type: 'otus:something-else' } });

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('does not post to the frame when there is no token', () => {
    store.data.token = {};
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    dispatchReadyMessage();

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

    expect(postMessage).not.toHaveBeenCalled();
  });

  test('applies the stored width to the panel', () => {
    store.view.userPreferences.otusTabWidth = 700;
    renderOtusTab();

    expect(getFrame().parentElement).toHaveStyle({ width: '700px' });
  });

  test('leaves the panel width to the stylesheet when there is no stored width', () => {
    renderOtusTab();

    expect(getFrame().parentElement).not.toHaveAttribute('style');
  });

  test('shows the width bounds of the panel in the resize handle', () => {
    renderOtusTab();

    expect(getResizeHandle()).toHaveAttribute('aria-valuemin', '512');
    expect(getResizeHandle()).toHaveAttribute('aria-valuenow', '736');
    expect(getResizeHandle()).toHaveAttribute('aria-valuemax', `${window.innerWidth - VERTICAL_NAV_RAIL_WIDTH_PIXELS}`);
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
    store.view.userPreferences.otusTabWidth = 520;
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{ArrowLeft}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: 512 })]);
  });

  test('narrows the panel to its minimum width when the user presses the home key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{Home}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({ otusTabWidth: 512 })]);
  });

  test('widens the panel to its maximum width when the user presses the end key on the resize handle', async () => {
    renderOtusTab();

    getResizeHandle().focus();
    await userEvent.keyboard('{End}');

    expect(reduxStore.getActions()).toEqual([updateUserPreferences({
      otusTabWidth: window.innerWidth - VERTICAL_NAV_RAIL_WIDTH_PIXELS,
    })]);
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

    expect(getFrame().parentElement).toHaveStyle({ width: '800px' });
    expect(getFrame().parentElement).toHaveClass('resizing');
  });

  test('ignores pointer moves that do not follow a pointer down', async () => {
    renderOtusTab();

    await movePointerTo(870);

    expect(reduxStore.getActions()).toEqual([]);
    expect(getFrame().parentElement).not.toHaveClass('resizing');
  });

  test('drops an interrupted drag without persisting it', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);
    fireEvent.pointerCancel(getResizeHandle());

    expect(reduxStore.getActions()).toEqual([]);
    expect(getFrame().parentElement).not.toHaveClass('resizing');
  });

  test('drops an in-progress drag when the layout falls below medium', async () => {
    renderOtusTab();

    await pressResizeHandle();
    await movePointerTo(870);
    useMatchMedia.mockImplementation(() => false);
    fireEvent.pointerMove(getResizeHandle(), { clientX: 880 });

    expect(getFrame().parentElement).not.toHaveClass('resizing');
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

    expect(getFrame().parentElement).not.toHaveAttribute('style');
  });
});
