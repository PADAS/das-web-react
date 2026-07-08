import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router';

import RequestConfigManager from './';
import useNavigate from '../hooks/useNavigate';
import { mockStore } from '../__test-helpers/MockStore';
import { POST_AUTH_SUCCESS } from '../ducks/auth';

jest.mock('axios', () => {
  const axiosFn = jest.fn();
  axiosFn.interceptors = {
    request: { use: jest.fn(() => 1), eject: jest.fn() },
    response: { use: jest.fn(() => 2), eject: jest.fn() },
  };
  axiosFn.defaults = { headers: { common: {} } };
  const CancelToken = { source: () => ({ token: {}, cancel: jest.fn() }) };
  axiosFn.CancelToken = CancelToken;
  return { __esModule: true, default: axiosFn, CancelToken };
});

jest.mock('@auth0/auth0-react');
jest.mock('react-router', () => ({ __esModule: true, useLocation: jest.fn() }));
jest.mock('../hooks/useNavigate');

const renderManager = () => {
  const store = mockStore({
    data: {
      selectedUserProfile: null,
      user: { id: 'u1' },
      masterRequestCancelToken: { token: {} },
      token: { access_token: 'existing.jwt.token' },
    },
    view: { userLocationAccessGranted: { granted: false } },
  });

  render(<Provider store={store}><RequestConfigManager /></Provider>);

  const calls = axios.interceptors.response.use.mock.calls;
  const [, rejected] = calls[calls.length - 1];
  return { store, rejected };
};

const make401 = (configOverrides = {}) => ({
  response: { status: 401 },
  config: { headers: {}, url: '/api/v1.0/events', ...configOverrides },
});

describe('RequestConfigManager 401 handling', () => {
  let navigate;

  beforeEach(() => {
    navigate = jest.fn();
    useLocation.mockReturnValue({ search: '' });
    useNavigate.mockReturnValue(navigate);
    useAuth0.mockReturnValue({ getAccessTokenSilently: jest.fn() });

    axios.mockReset();
    axios.interceptors.request.use.mockClear();
    axios.interceptors.response.use.mockClear();
    axios.defaults.headers.common = {};
    document.cookie = `token=;path=/;expires=${new Date(0).toUTCString()}`;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renews, persists the token, and replays preserving other headers', async () => {
    const getAccessTokenSilently = jest.fn().mockResolvedValue('new.jwt.token');
    useAuth0.mockReturnValue({ getAccessTokenSilently });
    axios.mockResolvedValue({ status: 200, data: 'ok' });

    const { store, rejected } = renderManager();
    const error = make401({ headers: { 'USER-PROFILE': 'p1', Authorization: 'Bearer old.jwt.token' } });
    const result = await rejected(error);

    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      retriedAfterRefresh: true,
      headers: expect.objectContaining({
        'USER-PROFILE': 'p1',
        Authorization: 'Bearer new.jwt.token',
      }),
    }));
    expect(result).toEqual({ status: 200, data: 'ok' });
    expect(document.cookie).toContain('token=new.jwt.token');
    expect(store.getActions()).toContainEqual(
      expect.objectContaining({
        type: POST_AUTH_SUCCESS,
        payload: { data: { access_token: 'new.jwt.token' } },
      })
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  test('renews once, replays once, and signs out (no loop) when the replay 401s again', async () => {
    const getAccessTokenSilently = jest.fn().mockResolvedValue('new.jwt.token');
    useAuth0.mockReturnValue({ getAccessTokenSilently });
    axios.mockRejectedValue({ response: { status: 401 } });

    const { rejected } = renderManager();

    await expect(rejected(make401())).rejects.toMatchObject({ response: { status: 401 } });
    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(1);
    const replayConfig = axios.mock.calls[0][0];
    expect(replayConfig.retriedAfterRefresh).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    // Re-enter as the interceptor would on the replay's 401: the marker is read,
    // so there is no second renewal — sign out.
    await expect(rejected({ response: { status: 401 }, config: replayConfig })).rejects.toBeDefined();
    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining('login') })
    ));
  });

  test('signs out and logs when the refresh grant fails', async () => {
    const renewalError = new Error('login_required');
    const getAccessTokenSilently = jest.fn().mockRejectedValue(renewalError);
    useAuth0.mockReturnValue({ getAccessTokenSilently });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { rejected } = renderManager();
    const error = make401();

    await expect(rejected(error)).rejects.toBe(error);
    expect(axios).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), renewalError);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining('login') })
    ));

    warnSpy.mockRestore();
  });

  test('a 401 with no config signs out without attempting renewal', async () => {
    const getAccessTokenSilently = jest.fn();
    useAuth0.mockReturnValue({ getAccessTokenSilently });

    const { rejected } = renderManager();
    const error = { response: { status: 401 } };

    await expect(rejected(error)).rejects.toBe(error);
    expect(getAccessTokenSilently).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining('login') })
    ));
  });

  test('skipAuth requests bypass renewal and sign-out', async () => {
    const getAccessTokenSilently = jest.fn();
    useAuth0.mockReturnValue({ getAccessTokenSilently });

    const { rejected } = renderManager();
    const error = make401({ skipAuth: true });

    await expect(rejected(error)).rejects.toBe(error);
    expect(getAccessTokenSilently).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('non-401 errors pass through untouched', async () => {
    const getAccessTokenSilently = jest.fn();
    useAuth0.mockReturnValue({ getAccessTokenSilently });

    const { rejected } = renderManager();
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(rejected(error)).rejects.toBe(error);
    expect(getAccessTokenSilently).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
