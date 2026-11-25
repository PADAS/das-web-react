import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import {
  CLIENT_BUILD_VERSION,
  DAS_HOST,
  MIN_VISIBLE_MAP_WIDTH_PIXELS,
  SIDEBAR_WIDTH_PIXELS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { act, fireEvent, render, screen } from '../../test-utils';
import { ATLAS_TOOL_NAMES, ATLAS_TOOLS } from '../../utils/atlas-tools/validate';
import toolsDocument from '../../utils/atlas-tools/tools.json';
import { clearAuth } from '../../ducks/auth';
import { fetchAtlasToken } from '../../ducks/atlas-token';
import { mockStore } from '../../__test-helpers/MockStore';
import { updateUserPreferences } from '../../ducks/user-preferences';
import { useAtlasTools } from '../../AtlasTools';
import { useMatchMedia } from '../../hooks';
import useNavigate from '../../hooks/useNavigate';

import OtusTab, { OTUS_READY_TIMEOUT_MS } from './';

jest.mock('../../ducks/atlas-token', () => ({
  ...jest.requireActual('../../ducks/atlas-token'),
  fetchAtlasToken: jest.fn(),
}));

jest.mock('../../ducks/auth', () => ({
  ...jest.requireActual('../../ducks/auth'),
  clearAuth: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useMatchMedia: jest.fn(),
}));

jest.mock('../../hooks/useNavigate', () => jest.fn());

jest.mock('../../AtlasTools', () => ({ ...jest.requireActual('../../AtlasTools'), useAtlasTools: jest.fn() }));

const ATLAS_TOKEN = { expiresAt: '2026-11-18T20:00:00Z', expiresIn: 28800, token: 'the-atlas-token' };
const OTUS_URL = 'https://otus.example.com';
const RATE_LIMITED_ERROR = Object.assign(new Error('Request failed with status code 429'), {
  response: { data: { code: 'rate_limited' }, status: 429 },
});
const SESSION_EXPIRING_ERROR = Object.assign(new Error('Request failed with status code 401'), {
  response: { data: { code: 'session_expiring' }, status: 401 },
});
const UNAUTHORIZED_ERROR = Object.assign(new Error('Request failed with status code 401'), {
  response: { data: { detail: 'Invalid token.' }, status: 401 },
});
const MAX_WIDTH = 1440 - VERTICAL_NAV_RAIL_WIDTH_PIXELS - MIN_VISIBLE_MAP_WIDTH_PIXELS;

describe('SideBar - OtusTab', () => {
  let callTool, navigate, reduxStore, store, user;
  beforeEach(() => {
    clearAuth.mockImplementation(() => () => {});
    fetchAtlasToken.mockImplementation(() => () => Promise.resolve(ATLAS_TOKEN));
    callTool = jest.fn();
    useAtlasTools.mockImplementation(() => ({ callTool }));
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

  const rejectAtlasTokenRequests = (error = new Error('Request failed')) => fetchAtlasToken.mockImplementation(
    () => () => Promise.reject(error)
  );

  const dispatchReadyMessage = (overrides = {}) => act(async () => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'otus:ready' },
    origin: OTUS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const dispatchFrameMessage = (data, overrides = {}) => act(() => window.dispatchEvent(new MessageEvent('message', {
    data,
    origin: OTUS_URL,
    source: getFrame().contentWindow,
    ...overrides,
  })));

  const dispatchThreadsMessage = (data, overrides = {}) => dispatchFrameMessage({ type: 'otus:threads', ...data }, overrides);

  const connectMessage = (atlasToken = ATLAS_TOKEN) => [
    {
      atlas_tools: { names: ATLAS_TOOL_NAMES, version: toolsDocument.version },
      client_version: CLIENT_BUILD_VERSION,
      expires_at: atlasToken.expiresAt,
      site_url: DAS_HOST,
      token: atlasToken.token,
      type: 'otus:connect',
    },
    OTUS_URL,
  ];

  const LOAD_ERROR_MESSAGE = 'Atlas couldn\'t load on this site. Try again, or contact support if this keeps happening.';
  const SESSION_EXPIRING_MESSAGE = 'Your session ends soon. Log in again to use Atlas.';

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

  test('disables the new conversation button while the frame reports Atlas is starting', () => {
    renderOtusTab();

    dispatchFrameMessage({ type: 'otus:booting', booting: true });

    expect(screen.getByRole('button', { name: 'New conversation' })).toBeDisabled();
  });

  test('enables the new conversation button once the frame reports Atlas has started', () => {
    renderOtusTab();
    dispatchFrameMessage({ type: 'otus:booting', booting: true });

    dispatchFrameMessage({ type: 'otus:booting', booting: false });

    expect(screen.getByRole('button', { name: 'New conversation' })).toBeEnabled();
  });

  test('ignores a booting message that does not come from the frame origin', () => {
    renderOtusTab();

    dispatchFrameMessage({ type: 'otus:booting', booting: true }, { origin: 'https://evil.example.com' });

    expect(screen.getByRole('button', { name: 'New conversation' })).toBeEnabled();
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

  test('tells the frame on connecting which version of the tools contract it has, and every tool\'s name', async () => {
    renderOtusTab();
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(postMessage.mock.calls[0][0].atlas_tools).toEqual({
      names: [
        'events-filter',
        'patrols-filter',
        'open-event',
        'open-patrol',
        'subject-popup',
        'subject-track',
        'subject-at-time',
        'subject-heatmap',
        'report-heatmap',
        'subjects-visibility',
        'show-feature',
        'show-analyzer',
        'layers-search',
        'jump-to',
        'fit-bounds',
        'open-record',
      ],
      version: 1,
    });
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

  test('asks the user to log in again without logging them out when the session ends soon', async () => {
    rejectAtlasTokenRequests(SESSION_EXPIRING_ERROR);
    renderOtusTab();
    fireEvent.load(getFrame());
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(SESSION_EXPIRING_MESSAGE);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(getFrame()).not.toBeVisible();
    expect(postMessage).not.toHaveBeenCalled();
    expect(clearAuth).not.toHaveBeenCalled();
  });

  test('logs the user out so they can log in again when the log in again button is clicked', async () => {
    rejectAtlasTokenRequests(SESSION_EXPIRING_ERROR);
    renderOtusTab();
    fireEvent.load(getFrame());
    await dispatchReadyMessage();

    await user.click(screen.getByRole('button', { name: 'Log in again' }));

    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  test('shows the load error instead of the log-in prompt when the Atlas token request is rate limited', async () => {
    rejectAtlasTokenRequests(RATE_LIMITED_ERROR);
    renderOtusTab();
    fireEvent.load(getFrame());
    const postMessage = mockFramePostMessage();

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByRole('button', { name: 'Log in again' })).toBeNull();
    expect(postMessage).not.toHaveBeenCalled();
  });

  test('shows the load error instead of the log-in prompt when the Atlas token request is unauthorized', async () => {
    rejectAtlasTokenRequests(UNAUTHORIZED_ERROR);
    renderOtusTab();
    fireEvent.load(getFrame());

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByRole('button', { name: 'Log in again' })).toBeNull();
  });

  test('keeps the log-in prompt when a later Atlas token request fails otherwise', async () => {
    fetchAtlasToken
      .mockImplementationOnce(() => () => Promise.reject(SESSION_EXPIRING_ERROR))
      .mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
    renderOtusTab();
    fireEvent.load(getFrame());
    await dispatchReadyMessage();

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(SESSION_EXPIRING_MESSAGE);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  test('shows the load error for a later failure once an Atlas token cleared the log-in prompt', async () => {
    fetchAtlasToken
      .mockImplementationOnce(() => () => Promise.reject(SESSION_EXPIRING_ERROR))
      .mockImplementationOnce(() => () => Promise.resolve(ATLAS_TOKEN))
      .mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
    renderOtusTab();
    fireEvent.load(getFrame());
    mockFramePostMessage();
    await dispatchReadyMessage();
    await dispatchReadyMessage();

    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
  });

  test('clears the log-in prompt when a later Atlas token request connects the frame', async () => {
    fetchAtlasToken.mockImplementationOnce(() => () => Promise.reject(SESSION_EXPIRING_ERROR));
    renderOtusTab();
    fireEvent.load(getFrame());
    const postMessage = mockFramePostMessage();
    await dispatchReadyMessage();

    expect(screen.getByRole('alert')).toHaveTextContent(SESSION_EXPIRING_MESSAGE);

    await dispatchReadyMessage();

    expect(postMessage.mock.calls).toEqual([connectMessage()]);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(getFrame()).toBeVisible();
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

  describe('MCP messages', () => {
    const SUBJECT_ID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';
    const RESULT = {
      _meta: { status: 'applied' },
      content: [{ text: 'Showed the popup of subject.', type: 'text' }],
      isError: false,
    };

    let warn;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      callTool.mockImplementation(() => Promise.resolve(RESULT));
    });

    afterEach(() => {
      warn.mockRestore();
    });

    const dispatchMcpMessage = (data, overrides = {}) => dispatchFrameMessage(
      { type: 'otus:mcp', jsonrpc: '2.0', ...data },
      overrides
    );

    const flushReplies = () => act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const callMessage = (params, id = 7) => ({ id, method: 'tools/call', params });

    test('lists every tool to the frame, at its origin', async () => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage({ id: 'list-1', method: 'tools/list' });
      await flushReplies();

      expect(postMessage).toHaveBeenCalledWith(
        {
          type: 'otus:mcp',
          jsonrpc: '2.0',
          id: 'list-1',
          result: { _meta: { contractVersion: toolsDocument.version }, tools: ATLAS_TOOLS },
        },
        OTUS_URL
      );
      expect(postMessage.mock.calls[0][0].result.tools).toHaveLength(16);
      expect(Object.keys(postMessage.mock.calls[0][0].result.tools[0]).sort())
        .toEqual(['annotations', 'description', 'inputSchema', 'name']);
    });

    test('calls a tool with its arguments and batch, and replies with its result', async () => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(callMessage({
        _meta: { batch: 'reply-1' },
        arguments: { id: SUBJECT_ID, track: true },
        name: 'subject-popup',
      }));
      await flushReplies();

      expect(callTool).toHaveBeenCalledWith('subject-popup', { id: SUBJECT_ID, track: true }, { batch: 'reply-1' });
      expect(postMessage).toHaveBeenCalledWith({ type: 'otus:mcp', jsonrpc: '2.0', id: 7, result: RESULT }, OTUS_URL);
    });

    test('calls a tool without a batch when none is given', async () => {
      renderOtusTab();
      mockFramePostMessage();

      dispatchMcpMessage(callMessage({ arguments: { on: true }, name: 'report-heatmap' }));
      await flushReplies();

      expect(callTool).toHaveBeenCalledWith('report-heatmap', { on: true }, { batch: undefined });
    });

    describe('with a progress token', () => {
      const startedNotification = (progressToken) => ({
        type: 'otus:mcp',
        jsonrpc: '2.0',
        method: 'notifications/progress',
        params: { message: 'started', progress: 0, progressToken },
      });

      test.each([['a string', 'call-7'], ['a number', 7]])(
        'tells the frame when a call with %s as its token starts, before replying',
        async (_, progressToken) => {
          callTool.mockImplementation((name, args, { onStart }) => {
            onStart();

            return Promise.resolve(RESULT);
          });
          renderOtusTab();
          const postMessage = mockFramePostMessage();

          dispatchMcpMessage(callMessage({ _meta: { progressToken }, arguments: { on: true }, name: 'report-heatmap' }));
          await flushReplies();

          expect(postMessage.mock.calls).toEqual([
            [startedNotification(progressToken), OTUS_URL],
            [{ type: 'otus:mcp', jsonrpc: '2.0', id: 7, result: RESULT }, OTUS_URL],
          ]);
        }
      );

      test('says nothing of a call that never starts', async () => {
        const superseded = {
          _meta: { status: 'superseded' },
          content: [{ text: 'Skipped, superseded by a newer reply.', type: 'text' }],
          isError: true,
        };
        callTool.mockImplementation(() => Promise.resolve(superseded));
        renderOtusTab();
        const postMessage = mockFramePostMessage();

        dispatchMcpMessage(callMessage({ _meta: { progressToken: 'call-7' }, arguments: { on: true }, name: 'report-heatmap' }));
        await flushReplies();

        expect(callTool).toHaveBeenCalledWith('report-heatmap', { on: true }, { batch: undefined, onStart: expect.any(Function) });
        expect(postMessage.mock.calls).toEqual([[{ type: 'otus:mcp', jsonrpc: '2.0', id: 7, result: superseded }, OTUS_URL]]);
      });

      test.each([
        ['an object', { key: 1 }],
        ['null', null],
        ['an infinite number', Infinity],
      ])('does not ask to hear of the start with %s as the token', async (_, progressToken) => {
        renderOtusTab();
        mockFramePostMessage();

        dispatchMcpMessage(callMessage({ _meta: { progressToken }, arguments: { on: true }, name: 'report-heatmap' }));
        await flushReplies();

        expect(callTool).toHaveBeenCalledWith('report-heatmap', { on: true }, { batch: undefined, onStart: undefined });
      });

      test('tells the window that asked, even after the frame reloads', async () => {
        let startCall;
        callTool.mockImplementation((name, args, { onStart }) => new Promise((resolve) => {
          startCall = () => {
            onStart();
            resolve(RESULT);
          };
        }));
        fetchAtlasToken.mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
        renderOtusTab();
        fireEvent.load(getFrame());
        await dispatchReadyMessage();
        const postMessage = mockFramePostMessage();

        dispatchMcpMessage(callMessage({ _meta: { progressToken: 'call-7' }, arguments: { on: true }, name: 'report-heatmap' }));
        await user.click(screen.getByRole('button', { name: 'Try again' }));
        const reloadedFramePostMessage = mockFramePostMessage();
        await act(async () => startCall());
        await flushReplies();

        expect(postMessage).toHaveBeenCalledWith(startedNotification('call-7'), OTUS_URL);
        expect(reloadedFramePostMessage).not.toHaveBeenCalled();
      });
    });

    test('replies with an error result as a result, not a JSON-RPC error', async () => {
      const skipped = {
        _meta: { status: 'refused' },
        content: [{ text: 'Skipped, events are disabled.', type: 'text' }],
        isError: true,
      };
      callTool.mockImplementation(() => Promise.resolve(skipped));
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(callMessage({ arguments: { on: true }, name: 'report-heatmap' }));
      await flushReplies();

      expect(postMessage).toHaveBeenCalledWith({ type: 'otus:mcp', jsonrpc: '2.0', id: 7, result: skipped }, OTUS_URL);
    });

    test('replies with the invalid params error of a call the tools reject', async () => {
      callTool.mockImplementation(() => Promise.reject({ code: -32602, message: 'Unknown tool: delete-everything' }));
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(callMessage({ arguments: {}, name: 'delete-everything' }));
      await flushReplies();

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'otus:mcp', jsonrpc: '2.0', id: 7, error: { code: -32602, message: 'Unknown tool: delete-everything' } },
        OTUS_URL
      );
    });

    test.each([
      ['no params', undefined, 'tools/call needs params'],
      ['params that are not an object', 'subject-popup', 'tools/call needs params'],
      ['a batch that is not a string', { _meta: { batch: 3 }, arguments: {}, name: 'report-heatmap' }, '_meta.batch must be a string'],
    ])('replies with an invalid params error for %s', async (_, params, message) => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(callMessage(params));
      await flushReplies();

      expect(callTool).not.toHaveBeenCalled();
      expect(postMessage).toHaveBeenCalledWith(
        { type: 'otus:mcp', jsonrpc: '2.0', id: 7, error: { code: -32602, message } },
        OTUS_URL
      );
    });

    test('replies with a method not found error for an unknown method', async () => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage({ id: 8, method: 'resources/list' });
      await flushReplies();

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'otus:mcp', jsonrpc: '2.0', id: 8, error: { code: -32601, message: 'Method not found: resources/list' } },
        OTUS_URL
      );
    });

    test.each([
      ['no id', { id: undefined, method: 'tools/list' }],
      ['an id that is an object', { id: { key: 1 }, method: 'tools/list' }],
      ['a null id', { id: null, method: 'tools/list' }],
      ['another JSON-RPC version', { id: 1, jsonrpc: '1.0', method: 'tools/list' }],
      ['no JSON-RPC version', { id: 1, jsonrpc: undefined, method: 'tools/list' }],
    ])('ignores and warns about a message with %s', async (_, data) => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(data);
      await flushReplies();

      expect(postMessage).not.toHaveBeenCalled();
      expect(callTool).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('Ignoring a malformed Atlas MCP message', expect.anything());
    });

    test('ignores an MCP message from another origin', async () => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage(
        callMessage({ arguments: { on: true }, name: 'report-heatmap' }),
        { origin: 'https://impostor.example.com' }
      );
      await flushReplies();

      expect(callTool).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
    });

    test('ignores an MCP message from a window other than the frame', async () => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchMcpMessage({ id: 1, method: 'tools/list' }, { source: window });
      await flushReplies();

      expect(postMessage).not.toHaveBeenCalled();
    });

    test('replies to the window that asked, even after the frame reloads', async () => {
      let finishCall;
      callTool.mockImplementation(() => new Promise((resolve) => {
        finishCall = () => resolve(RESULT);
      }));
      fetchAtlasToken.mockImplementationOnce(() => () => Promise.reject(new Error('Request failed')));
      renderOtusTab();
      fireEvent.load(getFrame());
      await dispatchReadyMessage();
      const postMessage = mockFramePostMessage();
      const frameWindow = getFrame().contentWindow;

      dispatchMcpMessage(callMessage({ arguments: { on: true }, name: 'report-heatmap' }));
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      const reloadedFramePostMessage = mockFramePostMessage();
      await act(async () => finishCall());
      await flushReplies();

      expect(getFrame().contentWindow).not.toBe(frameWindow);
      expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 7, result: RESULT }), OTUS_URL);
      expect(reloadedFramePostMessage).not.toHaveBeenCalled();
    });

    test.each([
      ['otus:app', { action: 'report-heatmap', on: true }],
      ['otus:map', { action: 'jump-to', coordinates: [36.8, -1.3] }],
    ])('no longer acts on %s messages', async (type, data) => {
      renderOtusTab();
      const postMessage = mockFramePostMessage();

      dispatchFrameMessage({ type, ...data });
      await flushReplies();

      expect(callTool).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
    });

    test('does not treat an MCP message as the ready message', async () => {
      renderOtusTab();

      dispatchMcpMessage({ id: 1, method: 'tools/list' });
      await flushReplies();

      expect(fetchAtlasToken).not.toHaveBeenCalled();
    });
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
