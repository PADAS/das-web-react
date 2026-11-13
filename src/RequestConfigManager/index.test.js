import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import axios from 'axios';
import { useLocation } from 'react-router';

import RequestConfigManager from './';
import useNavigate from '../hooks/useNavigate';
import { mockStore } from '../__test-helpers/MockStore';
import { STATUS_API_URL } from '../ducks/system-status';
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
// Stub the store singleton so requireActual(auth-recovery) doesn't build the real reducer tree.
jest.mock('../store', () => ({ __esModule: true, default: { dispatch: jest.fn(), getState: () => ({ data: {} }) } }));
// Real challenge parsers (isStepUpChallenge / parseAuthChallenge); only recoverAuth is stubbed.
jest.mock('../utils/auth-recovery', () => ({
  ...jest.requireActual('../utils/auth-recovery'),
  recoverAuth: jest.fn(),
}));

const renderManager = ({ selectedUserProfile = null, user = { id: 'u1' } } = {}) => {
  const store = mockStore({
    data: {
      masterRequestCancelToken: { token: {} },
      selectedUserProfile,
      token: { access_token: 'existing.jwt.token' },
      user,
    },
    view: { userLocationAccessGranted: { granted: false } },
  });

  render(<Provider store={store}><RequestConfigManager /></Provider>);

  const requestCalls = axios.interceptors.request.use.mock.calls;
  const responseCalls = axios.interceptors.response.use.mock.calls;
  const [, rejected] = responseCalls[responseCalls.length - 1];
  return { rejected, requestHandler: requestCalls[requestCalls.length - 1][0], store };
};

const make401 = (configOverrides = {}) => ({
  response: { status: 401 },
  config: { headers: {}, url: '/api/v1.0/events', ...configOverrides },
});

describe('RequestConfigManager', () => {
  describe('401 handling', () => {
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

    test('a 401 carrying an RFC 9470 step-up challenge routes to interactive step-up', async () => {
      recoverAuth.mockResolvedValue('mfa.jwt.token');
      axios.mockResolvedValue({ status: 200, data: 'ok' });

      const { rejected } = renderManager();
      const challenge = 'Bearer error="insufficient_user_authentication", acr_values="http://schemas.openid.net/pape/policies/2007/06/multi-factor", max_age="31536000"';
      const error = {
        response: { status: 401, headers: { 'www-authenticate': challenge } },
        config: { headers: {}, url: '/api/v1.0/events' },
      };

      await rejected(error);

      expect(recoverAuth).toHaveBeenCalledWith({
        stepUp: true,
        challenge: {
          error: 'insufficient_user_authentication',
          acrValues: 'http://schemas.openid.net/pape/policies/2007/06/multi-factor',
          maxAge: '31536000',
        },
      });
      expect(navigate).not.toHaveBeenCalled();
    });

    test('a 401 with an ordinary WWW-Authenticate challenge takes the silent-renew path', async () => {
      recoverAuth.mockResolvedValue('new.jwt.token');
      axios.mockResolvedValue({ status: 200, data: 'ok' });

      const { rejected } = renderManager();
      const error = {
        response: { status: 401, headers: { 'www-authenticate': 'Bearer error="invalid_token"' } },
        config: { headers: {}, url: '/api/v1.0/events' },
      };
      await rejected(error);

      expect(recoverAuth).toHaveBeenCalledWith(undefined);
      expect(navigate).not.toHaveBeenCalled();
    });

    test('escalates to step-up (not sign-out) when a silently-renewed request then 401s with a step-up challenge', async () => {
      recoverAuth.mockResolvedValue('renewed.jwt.token');
      axios.mockResolvedValue({ status: 200, data: 'ok' });

      const { rejected } = renderManager();

      // Ordinary 401 → silent renew → replay carries retriedAfterRefresh.
      await rejected(make401());
      const replayConfig = axios.mock.calls[0][0];
      expect(replayConfig.retriedAfterRefresh).toBe(true);

      // The replay comes back as a step-up 401 (token now valid but MFA stale).
      const challenge = 'Bearer error="insufficient_user_authentication", acr_values="urn:mfa", max_age="3600"';
      await rejected({
        response: { status: 401, headers: { 'www-authenticate': challenge } },
        config: replayConfig,
      });

      expect(recoverAuth).toHaveBeenCalledWith({
        stepUp: true,
        challenge: { error: 'insufficient_user_authentication', acrValues: 'urn:mfa', maxAge: '3600' },
      });
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

  describe('request headers', () => {
    beforeEach(() => {
      useLocation.mockReturnValue({ search: '' });
      useNavigate.mockReturnValue(jest.fn());

      axios.interceptors.request.use.mockClear();
      axios.interceptors.response.use.mockClear();
      axios.defaults.headers.common = {};
    });

    const makeStatusConfig = () => ({ headers: { Authorization: 'Bearer existing.jwt.token' }, url: STATUS_API_URL });

    test('keeps the Authorization header on a system status request', () => {
      const { requestHandler } = renderManager();

      expect(requestHandler(makeStatusConfig()).headers.Authorization).toBe('Bearer existing.jwt.token');
    });

    test('sends the active profile with a system status request', () => {
      const { requestHandler } = renderManager({ selectedUserProfile: { id: 'p1' } });

      expect(requestHandler(makeStatusConfig()).headers)
        .toEqual({ Authorization: 'Bearer existing.jwt.token', 'USER-PROFILE': 'p1' });
    });

    test('does not send a profile header when no profile is selected', () => {
      const { requestHandler } = renderManager();

      expect(requestHandler(makeStatusConfig()).headers).not.toHaveProperty('USER-PROFILE');
    });
  });
});
