import { renderHook } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import useAuthRecovery from './useAuthRecovery';
import { registerAuthRecovery } from '../utils/auth-recovery';
import { setIntendedPostAuth0SuccessRoute } from '../utils/auth';

jest.mock('@auth0/auth0-react');
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('react-router', () => ({ __esModule: true, useLocation: jest.fn() }));
jest.mock('../utils/auth-recovery', () => ({ registerAuthRecovery: jest.fn() }));
jest.mock('../utils/auth', () => ({ setIntendedPostAuth0SuccessRoute: jest.fn() }));
jest.mock('../config', () => ({ __esModule: true, default: { auth0: { audience: 'https://api.example' } } }));

const getRegistered = () => registerAuthRecovery.mock.calls.at(-1)[0];

describe('useAuthRecovery', () => {
  let getAccessTokenSilently;
  let loginWithRedirect;

  beforeEach(() => {
    getAccessTokenSilently = jest.fn();
    loginWithRedirect = jest.fn().mockResolvedValue(undefined);
    useAuth0.mockReturnValue({ getAccessTokenSilently, loginWithRedirect });
    useSelector.mockReturnValue(null); // idp_org_id (common-DB site)
    useLocation.mockReturnValue({ pathname: '/events/123', search: '?foo=bar' });
  });

  test('registers a silentRenew primitive backed by getAccessTokenSilently', async () => {
    renderHook(() => useAuthRecovery());

    await getRegistered().silentRenew();

    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
  });

  test('registers a stepUp primitive that stashes returnTo and re-runs PKCE with acr_values/max_age', () => {
    renderHook(() => useAuthRecovery());

    getRegistered().stepUp({ acrValues: 'urn:mfa', maxAge: '3600' });

    expect(setIntendedPostAuth0SuccessRoute).toHaveBeenCalledWith('/events/123?foo=bar');
    expect(loginWithRedirect).toHaveBeenCalledWith({
      authorizationParams: expect.objectContaining({
        audience: 'https://api.example',
        acr_values: 'urn:mfa',
        max_age: '3600',
      }),
    });
  });

  test('stepUp omits acr_values / max_age when the challenge lacks them', () => {
    renderHook(() => useAuthRecovery());

    getRegistered().stepUp({});

    const { authorizationParams } = loginWithRedirect.mock.calls[0][0];
    expect(Object.keys(authorizationParams)).not.toContain('acr_values');
    expect(Object.keys(authorizationParams)).not.toContain('max_age');
  });

  test('stepUp rejects when loginWithRedirect fails, so recovery can fall through to sign-out', async () => {
    loginWithRedirect.mockRejectedValue(new Error('pkce_failed'));
    renderHook(() => useAuthRecovery());

    let settled = 'pending';
    getRegistered().stepUp({ acrValues: 'urn:mfa', maxAge: '3600' })
      .then(() => { settled = 'resolved'; }, () => { settled = 'rejected'; });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe('rejected');
  });

  test('stepUp does not settle on a successful redirect (blocks replay until the page unloads)', async () => {
    loginWithRedirect.mockResolvedValue(undefined);
    renderHook(() => useAuthRecovery());

    let settled = 'pending';
    getRegistered().stepUp({ acrValues: 'urn:mfa', maxAge: '3600' })
      .then(() => { settled = 'resolved'; }, () => { settled = 'rejected'; });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe('pending');
  });
});
