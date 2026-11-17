import axios from 'axios';
import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';

import { API_URL } from '../../constants';
import { clearAuth } from '../auth';
import { mockStore } from '../../__test-helpers/MockStore';
import { recoverAuth } from '../../utils/auth-recovery';
import { render } from '../../test-utils';
import useNavigate from '../../hooks/useNavigate';

import RequestConfigManager from '../../RequestConfigManager';

import { ATLAS_TOKEN_API_URL, fetchAtlasToken } from './';

jest.mock('../../hooks/useNavigate');
jest.mock('../../hooks/useAuthRecovery');
jest.mock('../../store', () => ({
  __esModule: true,
  default: { dispatch: jest.fn(), getState: () => ({ data: {} }) },
}));
jest.mock('../auth', () => ({
  ...jest.requireActual('../auth'),
  clearAuth: jest.fn(() => () => Promise.resolve()),
}));
jest.mock('../../utils/auth-recovery', () => ({
  ...jest.requireActual('../../utils/auth-recovery'),
  recoverAuth: jest.fn(),
}));

const ACCESS_TOKEN = 'user-token';
const CONTROL_API_URL = `${API_URL}control/`;
const PROFILE_ID = 'profile-id';
const USER_ID = 'user-id';

const server = setupServer();

const renderAtlasToken = (options = {}) => {
  const masterRequestCancelToken = axios.CancelToken.source();
  const store = mockStore({
    data: {
      masterRequestCancelToken,
      selectedUserProfile: options.selectedUserProfile ?? null,
      token: { access_token: ACCESS_TOKEN },
      user: { id: USER_ID },
    },
    view: { userLocationAccessGranted: { granted: false } },
  });
  render(
    <Provider store={store}>
      <RequestConfigManager />
    </Provider>
  );

  return { masterRequestCancelToken, store };
};

const rejectWith = async (store, response) => {
  server.use(http.post(ATLAS_TOKEN_API_URL, () => HttpResponse.json(response.data, {
    status: response.status,
  })));

  return store.dispatch(fetchAtlasToken()).catch((error) => error);
};

describe('ducks - atlas-token', () => {
  let navigate;
  let requestBody;
  let requestCount;
  let requestHeaders;
  let requestMethod;
  let requestUrl;
  let userProfileHeader;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    navigate = jest.fn();
    requestBody = null;
    requestCount = 0;
    requestHeaders = null;
    requestMethod = null;
    requestUrl = null;
    recoverAuth.mockReset();
    userProfileHeader = undefined;
    useNavigate.mockReturnValue(navigate);
  });

  afterEach(() => {
    server.resetHandlers();
    jest.restoreAllMocks();
    delete axios.defaults.headers.common.Authorization;
  });

  afterAll(() => server.close());

  test('returns the token and its expiration values', async () => {
    server.use(http.post(ATLAS_TOKEN_API_URL, () => HttpResponse.json({
      data: {
        access_token: 'atlas-token',
        expires_at: '2026-11-17T20:00:00Z',
        expires_in: 28800,
      },
    })));
    const rendered = renderAtlasToken();

    await expect(rendered.store.dispatch(fetchAtlasToken())).resolves.toEqual({
      expiresAt: '2026-11-17T20:00:00Z',
      expiresIn: 28800,
      token: 'atlas-token',
    });
  });

  test('posts with no body and the user authorization header', async () => {
    server.use(http.post(ATLAS_TOKEN_API_URL, async (requestInfo) => {
      requestBody = await requestInfo.request.text();
      requestHeaders = requestInfo.request.headers;
      requestMethod = requestInfo.request.method;
      requestUrl = requestInfo.request.url;

      return HttpResponse.json({ data: {} });
    }));
    const rendered = renderAtlasToken();

    await rendered.store.dispatch(fetchAtlasToken());

    expect(requestBody).toBe('');
    expect(requestHeaders.get('authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(requestMethod).toBe('POST');
    expect(requestUrl).toBe(`${API_URL}user/me/atlas-token/`);
  });

  test('routes an ordinary request through auth recovery', async () => {
    recoverAuth.mockResolvedValue('renewed-user-token');
    server.use(http.get(CONTROL_API_URL, () => {
      requestCount += 1;

      return requestCount === 1
        ? new HttpResponse(null, { status: 401 })
        : HttpResponse.json({ data: {} });
    }));
    renderAtlasToken();

    await expect(axios.get(CONTROL_API_URL)).resolves.toMatchObject({ status: 200 });

    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test.each([
    [401, 'session_expiring'],
    [429, 'rate_limited'],
  ])('rejects a %s response with its original error', async (status, code) => {
    const rendered = renderAtlasToken();

    const error = await rejectWith(rendered.store, { data: { code, detail: 'Nope' }, status });

    expect(error).toBeInstanceOf(Error);
    expect(error.response.data.code).toBe(code);
    expect(error.response.status).toBe(status);
    expect(console.warn).toHaveBeenCalledWith('Error fetching the Atlas token', error);
    expect(recoverAuth).not.toHaveBeenCalled();
    expect(clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('rejects a 401 response with no code', async () => {
    const rendered = renderAtlasToken();

    const error = await rejectWith(rendered.store, {
      data: { detail: 'Authentication credentials were not provided.' },
      status: 401,
    });

    expect(error.response.data.code).toBeUndefined();
    expect(error.response.status).toBe(401);
    expect(recoverAuth).not.toHaveBeenCalled();
    expect(clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('rethrows a canceled request', async () => {
    const rendered = renderAtlasToken();
    rendered.masterRequestCancelToken.cancel('Request canceled');

    const error = await rendered.store.dispatch(fetchAtlasToken()).catch((requestError) => requestError);

    expect(axios.isCancel(error)).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('does not send the active user profile header', async () => {
    server.use(http.post(ATLAS_TOKEN_API_URL, (requestInfo) => {
      userProfileHeader = requestInfo.request.headers.get('user-profile');

      return HttpResponse.json({ data: {} });
    }));
    const rendered = renderAtlasToken({ selectedUserProfile: { id: PROFILE_ID } });

    await rendered.store.dispatch(fetchAtlasToken());

    expect(userProfileHeader).toBeNull();
  });
});
