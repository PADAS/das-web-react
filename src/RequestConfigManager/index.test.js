import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import axios from 'axios';
import { useLocation } from 'react-router';

import RequestConfigManager from './';
import useNavigate from '../hooks/useNavigate';
import { mockStore } from '../__test-helpers/MockStore';
import { recoverAuth } from '../utils/auth-recovery';

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

jest.mock('react-router', () => ({ __esModule: true, useLocation: jest.fn() }));
jest.mock('../hooks/useNavigate');
jest.mock('../hooks/useAuthRecovery');
jest.mock('../utils/auth-recovery', () => ({ recoverAuth: jest.fn() }));

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

    axios.mockReset();
    axios.interceptors.request.use.mockClear();
    axios.interceptors.response.use.mockClear();
    axios.defaults.headers.common = {};
  });

  test('recovers the token via recoverAuth and replays the request preserving other headers', async () => {
    recoverAuth.mockResolvedValue('new.jwt.token');
    axios.mockResolvedValue({ status: 200, data: 'ok' });

    const { rejected } = renderManager();
    const error = make401({ headers: { 'USER-PROFILE': 'p1', Authorization: 'Bearer old.jwt.token' } });
    const result = await rejected(error);

    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      retriedAfterRefresh: true,
      headers: expect.objectContaining({
        'USER-PROFILE': 'p1',
        Authorization: 'Bearer new.jwt.token',
      }),
    }));
    expect(result).toEqual({ status: 200, data: 'ok' });
    expect(navigate).not.toHaveBeenCalled();
  });

  test('recovers once, replays once, and signs out (no loop) when the replay 401s again', async () => {
    recoverAuth.mockResolvedValue('new.jwt.token');
    axios.mockRejectedValue({ response: { status: 401 } });

    const { rejected } = renderManager();

    await expect(rejected(make401())).rejects.toMatchObject({ response: { status: 401 } });
    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(1);
    const replayConfig = axios.mock.calls[0][0];
    expect(replayConfig.retriedAfterRefresh).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    // Re-enter as the interceptor would on the replay's 401: the marker is set,
    // so there is no second recovery — sign out.
    await expect(rejected({ response: { status: 401 }, config: replayConfig })).rejects.toBeDefined();
    expect(recoverAuth).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining('login') })
    ));
  });

  test('signs out and logs when recovery fails', async () => {
    const renewalError = new Error('login_required');
    recoverAuth.mockRejectedValue(renewalError);
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

  test('a 401 with no config signs out without attempting recovery', async () => {
    const { rejected } = renderManager();
    const error = { response: { status: 401 } };

    await expect(rejected(error)).rejects.toBe(error);
    expect(recoverAuth).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining('login') })
    ));
  });

  test('skipAuth requests bypass recovery and sign-out', async () => {
    const { rejected } = renderManager();
    const error = make401({ skipAuth: true });

    await expect(rejected(error)).rejects.toBe(error);
    expect(recoverAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('non-401 errors pass through untouched', async () => {
    const { rejected } = renderManager();
    const error = { response: { status: 500 }, config: { headers: {} } };

    await expect(rejected(error)).rejects.toBe(error);
    expect(recoverAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
