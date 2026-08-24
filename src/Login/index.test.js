import React from 'react';
import { Provider } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import userEvent from '@testing-library/user-event';

import { APP_ROUTES } from '../constants/routes';
import appConfig from '../config';
import { clearAuth, postAuth } from '../ducks/auth';
import { fetchEula } from '../ducks/eula';
import {
  markLocalUserLoginAttempt,
  markLocalUserNotProvisioned,
  takeLocalUserLoginAttempt,
} from '../utils/auth';
import { mockStore } from '../__test-helpers/MockStore';
import i18n from '../i18nForTests';
import { act, render, screen, waitFor } from '../test-utils';
import { SYSTEM_CONFIG_FLAGS } from '../constants';
import useNavigate from '../hooks/useNavigate';

import Login from './';
import * as loginStyles from './styles.module.scss';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

jest.mock('../ducks/eula', () => ({
  ...jest.requireActual('../ducks/eula'),
  fetchEula: jest.fn(),
}));

jest.mock('../ducks/auth', () => ({
  ...jest.requireActual('../ducks/auth'),
  postAuth: jest.fn(),
  clearAuth: jest.fn(),
}));

jest.mock('../hooks/useNavigate', () => jest.fn());

describe('Login', () => {
  let loginWithRedirect, navigate, store;
  beforeEach(() => {
    loginWithRedirect = jest.fn();
    navigate = jest.fn();

    clearAuth.mockImplementation(() => () => Promise.resolve());
    fetchEula.mockImplementation(() => () => Promise.resolve());
    postAuth.mockImplementation(() => () => Promise.resolve());
    useAuth0.mockReturnValue({ loginWithRedirect, isLoading: false });
    useNavigate.mockImplementation(() => navigate);

    store = mockStore({
      data: {
        eula: {
          eula_url: '',
        },
      },
      view: {
        systemConfig: {},
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderLogin = (renderOptions = {}) => render(
    <Provider store={store}>
      <Login />
    </Provider>,
    renderOptions,
  );

  test('renders the EarthRanger logo', () => {
    renderLogin();

    const logo = screen.getByRole('img', { name: 'EarthRanger' });
    expect(logo).toBeVisible();
    expect(logo).toHaveAttribute('role', 'img');
    expect(logo).toHaveAttribute('aria-label', 'EarthRanger');
  });

  test('exposes the page title as a level-one heading for assistive technologies', () => {
    renderLogin();

    const title = screen.getByRole('heading', { level: 1, name: 'Log In' });
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass(loginStyles.srOnly);
    expect(title.parentElement).toHaveClass(loginStyles.container);
  });

  test('shows the Auth0 sign-in button and hides local credentials when IDP login is required', () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
    });

    renderLogin();

    const signIn = screen.getByRole('button', { name: 'Sign in' });
    expect(signIn).toBeVisible();
    expect(signIn).toHaveAttribute('type', 'button');
    expect(signIn).toBeEnabled();
    expect(signIn).toHaveAttribute('aria-busy', 'false');
    expect(signIn).not.toHaveAttribute('aria-label');
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
  });

  test('calls loginWithRedirect with audience and organization when the user clicks Sign in', async () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
    });
    loginWithRedirect.mockResolvedValue(undefined);

    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(loginWithRedirect).toHaveBeenCalledWith({
      authorizationParams: {
        audience: appConfig.auth0.audience,
        organization: 'org_abc',
      },
    });
  });

  test('disables the Auth0 sign-in button and shows a loading state while Auth0 reports loading', () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
    });
    useAuth0.mockReturnValue({ loginWithRedirect, isLoading: true });

    renderLogin();

    const button = screen.getByRole('button', { name: 'Loading' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-label', 'Loading');
    expect(button).toBeDisabled();
  });

  test('shows the common-DB "Sign in with email" button and no configuration error when IDP is required without an organization ID', () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true } },
    });

    renderLogin();

    const signIn = screen.getByRole('button', { name: 'Sign in with email' });
    expect(signIn).toBeVisible();
    expect(signIn).toHaveAttribute('type', 'button');
    expect(signIn).toBeEnabled();
    expect(screen.queryByText('Identity provider organization is not configured.')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
  });

  test('calls loginWithRedirect with audience and no organization when the user clicks Sign in with email', async () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true } },
    });
    loginWithRedirect.mockResolvedValue(undefined);

    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with email' }));

    expect(loginWithRedirect).toHaveBeenCalledWith({
      authorizationParams: { audience: appConfig.auth0.audience },
    });
  });

  describe('local-user sign-in', () => {
    const localUserSystemConfig = {
      require_idp: true,
      site_slug: 'gdl-zoo',
      support_managed_users: true,
    };

    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    test('offers the local-user path when the site has local users and the server named its connection', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin();

      const localUser = screen.getByRole('button', { name: 'Sign in as a local user' });
      expect(localUser).toBeVisible();
      expect(localUser).toHaveAttribute('type', 'button');
      expect(localUser).toBeEnabled();
      // Both classes, because every style rule for this button is written as a
      // modifier on .loginButton and reasons about the two co-occurring.
      expect(localUser).toHaveClass(loginStyles.loginButton, loginStyles.secondaryButton);
      expect(screen.getByRole('button', { name: 'Sign in with email' })).toBeVisible();
    });

    test('hides the local-user path on a site without local users', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { ...localUserSystemConfig, support_managed_users: false } },
      });

      renderLogin();

      expect(screen.queryByRole('button', { name: 'Sign in as a local user' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in with email' })).toBeVisible();
    });

    test('hides the local-user path when the server has not named the site connection', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { ...localUserSystemConfig, site_slug: null } },
      });

      renderLogin();

      expect(screen.queryByRole('button', { name: 'Sign in as a local user' })).not.toBeInTheDocument();
    });

    test('hides the local-user path on an org-scoped site, where the unmapped-user guard does not run', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { ...localUserSystemConfig, idp_org_id: 'org_abc' } },
      });

      renderLogin();

      expect(screen.queryByRole('button', { name: 'Sign in as a local user' })).not.toBeInTheDocument();
    });

    test('points at the local-user option from the migration guidance when it is offered', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin();

      expect(screen.getByText(
        'If your site admin gave you a username and password for this site only, select Sign in as a local user.'
      )).toBeVisible();
    });

    test('leaves the migration guidance alone on a site without local users', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { ...localUserSystemConfig, support_managed_users: false } },
      });

      renderLogin();

      expect(screen.queryByText(/for this site only/)).not.toBeInTheDocument();
    });

    test('hides the local-user path on a site that does not use Auth0', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { ...localUserSystemConfig, require_idp: false } },
      });

      renderLogin();

      expect(screen.queryByRole('button', { name: 'Sign in as a local user' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeVisible();
    });

    test('redirects with the site connection so Auth0 uses the local-user database', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      loginWithRedirect.mockResolvedValue(undefined);

      renderLogin();

      await userEvent.click(screen.getByRole('button', { name: 'Sign in as a local user' }));

      expect(loginWithRedirect).toHaveBeenCalledWith({
        authorizationParams: {
          audience: appConfig.auth0.audience,
          connection: 'gdl-zoo',
        },
      });
    });

    test('records the attempt so a failure returning from Auth0 can be attributed to this path', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      loginWithRedirect.mockResolvedValue(undefined);

      renderLogin();

      await userEvent.click(screen.getByRole('button', { name: 'Sign in as a local user' }));

      expect(takeLocalUserLoginAttempt()).toBe(true);
    });

    test('disables the local-user path while Auth0 is loading, keeping its label readable', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      useAuth0.mockReturnValue({ loginWithRedirect, isLoading: true });

      renderLogin();

      const localUser = screen.getByRole('button', { name: 'Sign in as a local user' });
      expect(localUser).toBeDisabled();
      expect(localUser).toHaveAttribute('aria-busy', 'true');
    });

    test('shows a sign-in failure alert when the local-user redirect rejects', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      loginWithRedirect.mockRejectedValue(new Error('nope'));

      renderLogin();

      await userEvent.click(screen.getByRole('button', { name: 'Sign in as a local user' }));

      await waitFor(() => {
        expect(screen.getByText('Sign-in failed. Please try again.')).toBeVisible();
      });
    });

    test('explains a callback failure that followed a local-user attempt', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=Something+Auth0+said'],
      });

      const alert = screen.getByText(
        'We couldn\'t sign you in as a local user. Local sign-in may not be ready on this site yet. Try again shortly, or contact your site admin.',
      );
      expect(alert).toBeVisible();
      expect(alert).toHaveAttribute('role', 'alert');
    });

    test('clears the attempt marker when the local-user redirect fails, so a later failure is not misattributed', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      loginWithRedirect.mockRejectedValue(new Error('nope'));

      renderLogin();

      await userEvent.click(screen.getByRole('button', { name: 'Sign in as a local user' }));

      await waitFor(() => {
        expect(screen.getByText('Sign-in failed. Please try again.')).toBeVisible();
      });
      // The redirect never left the page, so there is no attempt in flight to
      // attribute a later failure to.
      expect(takeLocalUserLoginAttempt()).toBe(false);
    });

    test('keeps the local-user explanation, translated, when the language changes', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=Something+Auth0+said'],
      });

      expect(screen.getByText(/We couldn't sign you in as a local user/)).toBeVisible();

      // Only en-US is bundled for tests, so register just the key under test.
      i18n.addResourceBundle('es', 'login', {
        errorAlert: { localUserSignInFailed: 'FALLO DE USUARIO LOCAL' },
      });

      try {
        await act(() => i18n.changeLanguage('es'));

        // Re-translated, and still the local-user key rather than the generic
        // access-denied one: the marker is spent, so a re-run must not re-derive it.
        expect(screen.getByText('FALLO DE USUARIO LOCAL')).toBeVisible();
      } finally {
        await act(() => i18n.changeLanguage('en-US'));
        i18n.removeResourceBundle('es', 'login');
      }
    });

    test('clears the Auth0 error from the URL so a reload cannot re-derive a different reason', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=Something+Auth0+said'],
      });

      expect(screen.getByText(/We couldn't sign you in as a local user/)).toBeVisible();

      // The marker is single-use, so reloading this URL would fall through to the
      // generic access-denied message — a claim about cause we decline to make.
      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
      });
    });

    test('strips only the Auth0 params, leaving anything else in the URL', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=Nope&foo=bar'],
      });

      // onFormSubmit forwards location.search onward, so query params on /login are
      // meaningful in general — dropping the whole string would discard them.
      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith('/login?foo=bar', { replace: true, state: null });
      });
    });

    test('spends the attempt marker on a visit with nothing to explain, so a later failure is not mislabeled', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      // First visit: the user backed out to the login page. There is nothing to
      // explain, but the attempt is over and the marker belongs to it.
      const { unmount } = renderLogin();
      unmount();

      // Second visit: a common-path failure must not inherit the stale marker.
      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=User+cancelled+login'],
      });

      expect(screen.getByText(
        'Access denied: You do not have permission to access this application.'
      )).toBeVisible();
    });

    test('explains an unprovisioned local account after the Auth0 logout brings the user back', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      // The logout redirect leaves the app, so router state cannot carry this.
      markLocalUserNotProvisioned();

      renderLogin();

      const alert = screen.getByText(
        'Your local account isn\'t set up on this site. Contact your site admin.'
      );
      expect(alert).toBeVisible();
      expect(alert).toHaveAttribute('role', 'alert');
      // Nothing to strip on this arrival — the logout returnTo carries no params.
      expect(navigate).not.toHaveBeenCalled();
    });

    test('names the local-user path when the token manager routes here after one', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin({
        initialEntries: [{ pathname: '/login', state: { localUserSignInFailed: true } }],
      });

      expect(screen.getByText(/We couldn't sign you in as a local user/)).toBeVisible();
    });

    test('keeps the incomplete-sign-in message for a linking error', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin({
        initialEntries: [{ pathname: '/login', state: { authLinkingError: true } }],
      });

      expect(screen.getByText(
        'We couldn\'t finish signing you in. Please try again.'
      )).toBeVisible();
    });

    test('attributes a local-user failure that arrives without a description', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      markLocalUserLoginAttempt();

      // error_description is optional in OAuth 2.0, and requiring it would make the
      // attribution silently no-op on exactly the failures we cannot predict.
      renderLogin({ initialEntries: ['/login?error=access_denied'] });

      expect(screen.getByText(/We couldn't sign you in as a local user/)).toBeVisible();
    });

    test('falls back to a generic message when Auth0 sends no description to quote', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin({ initialEntries: ['/login?error=invalid_request'] });

      expect(screen.getByText('An error has occurred. Please try again.')).toBeVisible();
    });

    test('strips the URL once, keeping the message and not repeating its mount work', async () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });
      // The real hook, so the strip actually changes the URL and the effect re-runs
      // — which a jest.fn() navigate can never exercise.
      useNavigate.mockImplementation(jest.requireActual('../hooks/useNavigate').default);
      markLocalUserLoginAttempt();

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=Something+Auth0+said'],
      });

      // Survives the re-render: the marker is spent by then, so a second pass must
      // not fall through to the generic access-denied message.
      await waitFor(() => {
        expect(screen.getByText(/We couldn't sign you in as a local user/)).toBeVisible();
      });
      expect(screen.queryByText(/Access denied/)).not.toBeInTheDocument();

      // Mount work stays mount work when the strip changes location.search. Stable
      // counts are also what rule out a strip/re-run loop.
      expect(clearAuth).toHaveBeenCalledTimes(1);
      expect(fetchEula).toHaveBeenCalledTimes(1);
    });

    test('leaves a callback failure with no local-user attempt to the common-path message', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: localUserSystemConfig },
      });

      renderLogin({
        initialEntries: ['/login?error=access_denied&error_description=User+cancelled+login'],
      });

      expect(screen.getByText(
        'Access denied: You do not have permission to access this application.',
      )).toBeVisible();
    });
  });

  describe('Auth0 sign-in info box', () => {
    test('renders the info box on a common-DB Auth0 site (require_idp without an organization ID)', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true } },
      });

      renderLogin();

      const infoBoxTitle = screen.getByRole('heading', { level: 2 });
      expect(infoBoxTitle).toBeVisible();

      const infoBox = infoBoxTitle.closest('section');
      expect(infoBox).toHaveClass(loginStyles.infoBox);
      expect(infoBox).toHaveAttribute('aria-labelledby', infoBoxTitle.id);

      // Links out to the DAS-server account linker for users who have not converted.
      const linkerLink = screen.getByRole('link', { name: 'Convert your account' });
      expect(linkerLink).toHaveAttribute('href', expect.stringContaining('/auth/link-accounts/'));

      // Additive: the Auth0 sign-in button still renders alongside the info box.
      expect(screen.getByRole('button', { name: 'Sign in with email' })).toBeVisible();

      // Helper text below the button.
      expect(screen.getByText('Questions? Reach out to your site admin.')).toBeVisible();
    });

    test('treats a whitespace-only organization ID as common-DB and still renders the info box', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: '   ' } },
      });

      renderLogin();

      expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Convert your account' })).toBeVisible();
      // Whitespace-only org id is treated as no org -> common-DB "Sign in with email".
      expect(screen.getByRole('button', { name: 'Sign in with email' })).toBeVisible();
    });

    test('does not render the info box on an org-scoped Auth0 site (require_idp with an organization ID)', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
      });

      renderLogin();

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Convert your account' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });

    test('does not render the info box on a site without Auth0 configured', () => {
      store = mockStore({
        data: { eula: { eula_url: '' } },
        view: { systemConfig: { require_idp: false } },
      });

      renderLogin();

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Convert your account' })).not.toBeInTheDocument();
      // The legacy username-and-password form is unchanged.
      expect(screen.getByLabelText('Username')).toBeVisible();
    });
  });

  test('shows a sign-in failure alert when loginWithRedirect rejects', async () => {
    store = mockStore({
      data: { eula: { eula_url: '' } },
      view: { systemConfig: { require_idp: true, idp_org_id: 'org_abc' } },
    });
    loginWithRedirect.mockRejectedValue(new Error('Auth0 failed'));

    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const alert = screen.getByText('Sign-in failed. Please try again.');
      expect(alert).toBeVisible();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveClass(loginStyles.alertMessage);
    });
  });

  test('shows the local username-and-password form when IDP login is not required', () => {
    renderLogin();

    const form = screen.getByRole('textbox', { name: 'Username' }).closest('form');
    expect(form).toHaveAttribute('noValidate');
    expect(form).toHaveClass(loginStyles.form);

    const username = screen.getByLabelText('Username');
    const password = screen.getByLabelText('Password');
    expect(username).toBeVisible();
    expect(password).toBeVisible();
    expect(username).toHaveAttribute('id', 'username');
    expect(username).toHaveAttribute('required');
    expect(username).toHaveAttribute('type', 'text');
    expect(password).toHaveAttribute('id', 'password');
    expect(password).toHaveAttribute('required');
    expect(password).toHaveAttribute('type', 'password');

    const submit = screen.getByRole('button', { name: 'Log in' });
    expect(submit).toBeVisible();
    expect(submit).toHaveAttribute('type', 'submit');
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute('aria-busy', 'false');
    expect(submit).not.toHaveAttribute('aria-label');
  });

  test('renders an enabled username field with the correct label and autocomplete', () => {
    renderLogin();

    const username = screen.getByRole('textbox', { name: 'Username' });
    const usernameLabel = screen.getByText('Username', { selector: 'label' });
    expect(usernameLabel).toHaveAttribute('for', 'username');
    expect(usernameLabel).toHaveClass(loginStyles.label);
    expect(usernameLabel).not.toHaveClass(loginStyles.error);

    expect(username).toBeEnabled();
    expect(username).toHaveAttribute('autoComplete', 'username');
    expect(username).toHaveAttribute('name', 'username');
    expect(username).not.toHaveAttribute('aria-invalid');
    expect(username).not.toHaveAttribute('aria-errormessage');
  });

  test('renders an enabled password field with the correct label and autocomplete', () => {
    renderLogin();

    const password = screen.getByLabelText('Password');
    const passwordLabel = screen.getByText('Password', { selector: 'label' });
    expect(passwordLabel).toHaveAttribute('for', 'password');
    expect(passwordLabel).toHaveClass(loginStyles.label);
    expect(passwordLabel).not.toHaveClass(loginStyles.error);

    expect(password).toBeEnabled();
    expect(password).toHaveAttribute('autoComplete', 'current-password');
    expect(password).toHaveAttribute('name', 'password');
    expect(password).not.toHaveAttribute('aria-invalid');
    expect(password).not.toHaveAttribute('aria-errormessage');
  });

  test('shows a username-required error and moves focus to the username field when both fields are empty', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const username = screen.getByLabelText('Username');
    const usernameLabel = screen.getByText('Username', { selector: 'label' });
    expect(usernameLabel).toHaveClass(loginStyles.label, loginStyles.error);

    expect(username).toHaveFocus();
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(username).toHaveAttribute('aria-errormessage', 'username-error');

    const usernameError = screen.getByText('Username is required.');
    expect(usernameError).toBeVisible();
    expect(usernameError).toHaveAttribute('id', 'username-error');
    expect(usernameError).toHaveAttribute('role', 'alert');

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-errormessage', 'password-error');
    expect(screen.getByText('Password is required.')).toBeVisible();
  });

  test('clears the username-required error after the user types in the username field', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Username is required.')).toBeInTheDocument();

    const username = screen.getByLabelText('Username');
    await userEvent.type(username, 'alice');

    expect(screen.queryByText('Username is required.')).not.toBeInTheDocument();
    expect(username).not.toHaveAttribute('aria-invalid');
    expect(username).not.toHaveAttribute('aria-errormessage');
    expect(screen.getByText('Username', { selector: 'label' })).not.toHaveClass(loginStyles.error);
  });

  test('shows a password-required error and moves focus to the password field when the password is empty', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const password = screen.getByLabelText('Password');
    const passwordLabel = screen.getByText('Password', { selector: 'label' });
    expect(passwordLabel).toHaveClass(loginStyles.label, loginStyles.error);

    expect(password).toHaveFocus();
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-errormessage', 'password-error');

    const passwordError = screen.getByText('Password is required.');
    expect(passwordError).toBeVisible();
    expect(passwordError).toHaveAttribute('id', 'password-error');
    expect(passwordError).toHaveAttribute('role', 'alert');
  });

  test('clears the password-required error after the user types in the password field', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByText('Password is required.')).toBeInTheDocument();

    const password = screen.getByLabelText('Password');
    await userEvent.type(password, 'secret');

    expect(screen.queryByText('Password is required.')).not.toBeInTheDocument();
    expect(password).not.toHaveAttribute('aria-invalid');
    expect(password).not.toHaveAttribute('aria-errormessage');
    expect(screen.getByText('Password', { selector: 'label' })).not.toHaveClass(loginStyles.error);
  });

  test('shows a loading state on the submit button while credentials are being verified', async () => {
    let resolvePostAuth;
    postAuth.mockImplementation(
      () => () => new Promise((resolve) => {
        resolvePostAuth = resolve;
      }),
    );

    renderLogin();

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const loadingButton = screen.getByRole('button', { name: 'Loading' });
    expect(loadingButton).toHaveAttribute('type', 'submit');
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    expect(loadingButton).toHaveAttribute('aria-label', 'Loading');
    expect(loadingButton).toBeDisabled();

    resolvePostAuth();
    await waitFor(() => {
      const idleButton = screen.getByRole('button', { name: 'Log in' });
      expect(idleButton).toBeEnabled();
      expect(idleButton).toHaveAttribute('aria-busy', 'false');
      expect(idleButton).not.toHaveAttribute('aria-label');
    });
  });

  test('shows an invalid-credentials alert, clears auth, and selects the username when the server rejects credentials (400)', async () => {
    const authError = Object.assign(new Error('Request failed'), {
      toJSON: () => ({ message: 'Request failed with status code 400' }),
    });
    postAuth.mockImplementation(() => () => Promise.reject(authError));

    renderLogin();

    const usernameInput = screen.getByLabelText('Username');
    const selectSpy = jest.spyOn(usernameInput, 'select').mockImplementation(() => {});

    await userEvent.type(usernameInput, 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      const alert = screen.getByText('Invalid credentials given. Please try again.');
      expect(alert).toBeVisible();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveClass(loginStyles.alertMessage);
    });
    expect(selectSpy).toHaveBeenCalled();
    expect(clearAuth).toHaveBeenCalled();
  });

  test('returns the submit button to its idle state after login completes successfully', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      const idleButton = screen.getByRole('button', { name: 'Log in' });
      expect(idleButton).toBeEnabled();
      expect(idleButton).toHaveAttribute('aria-busy', 'false');
      expect(idleButton).not.toHaveAttribute('aria-label');
    });
    expect(screen.queryByRole('button', { name: 'Loading' })).not.toBeInTheDocument();
  });

  test('navigates to the app route with the current search string after a successful login', async () => {
    renderLogin({ initialEntries: ['/login?next=1'] });

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        { pathname: APP_ROUTES.ROOT, search: '?next=1' },
        {},
      );
    });
  });

  test('navigates back to the protected route with login state when location.state.from is set', async () => {
    renderLogin({
      initialEntries: [
        {
          pathname: '/login',
          state: { from: { pathname: '/events', search: '?id=42' } },
        },
      ],
    });

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        { pathname: '/events', search: '?id=42' },
        { state: { comesFromLogin: true } },
      );
    });
  });

  test('sends trimmed username and password to postAuth', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText('Username'), '  alice  ');
    await userEvent.type(screen.getByLabelText('Password'), '  secret  ');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(postAuth).toHaveBeenCalledWith({ username: 'alice', password: 'secret' });
    });
  });

  test('shows a generic error alert without selecting the username when auth fails for a reason other than invalid credentials', async () => {
    const authError = Object.assign(new Error('Server error'), {
      toJSON: () => ({ message: 'Request failed with status code 500' }),
    });
    postAuth.mockImplementation(() => () => Promise.reject(authError));

    renderLogin();

    const usernameInput = screen.getByLabelText('Username');
    const selectSpy = jest.spyOn(usernameInput, 'select').mockImplementation(() => {});

    await userEvent.type(usernameInput, 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      const alert = screen.getByText('An error has occurred. Please try again.');
      expect(alert).toBeVisible();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveClass(loginStyles.alertMessage);
    });
    expect(selectSpy).not.toHaveBeenCalled();
    expect(clearAuth).toHaveBeenCalled();
  });

  test('clears the top-level alert when the user edits a field after a failed login', async () => {
    const authError = Object.assign(new Error('Request failed'), {
      toJSON: () => ({ message: 'Request failed with status code 400' }),
    });
    postAuth.mockImplementation(() => () => Promise.reject(authError));

    renderLogin();

    const usernameInput = screen.getByLabelText('Username');
    await userEvent.type(usernameInput, 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials given. Please try again.')).toBeVisible();
    });

    await userEvent.type(usernameInput, '2');

    expect(screen.queryByText('Invalid credentials given. Please try again.')).not.toBeInTheDocument();
  });

  test('dispatches clearAuth and fetchEula when the page mounts', () => {
    renderLogin();

    expect(clearAuth).toHaveBeenCalled();
    expect(fetchEula).toHaveBeenCalled();
  });

  test('shows the organization-access alert when the callback URL includes access_denied with a membership-related description', () => {
    renderLogin({
      initialEntries: ['/login?error=access_denied&error_description=user+is+not+part+of+the+org'],
    });

    const alert = screen.getByText(
      'Access denied: Your account is not authorized for this organization. Please contact your administrator.',
    );
    expect(alert).toBeVisible();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(loginStyles.alertMessage);
  });

  test('shows the generic access-denied alert when access_denied has no membership-related description', () => {
    renderLogin({
      initialEntries: ['/login?error=access_denied&error_description=User+cancelled+login'],
    });

    const alert = screen.getByText(
      'Access denied: You do not have permission to access this application.',
    );
    expect(alert).toBeVisible();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(loginStyles.alertMessage);
  });

  test('shows the authentication-failed alert when the callback URL includes an unauthorized error', () => {
    renderLogin({
      initialEntries: ['/login?error=unauthorized&error_description=bad+credentials'],
    });

    const alert = screen.getByText(
      'Authentication failed: Please check your credentials and try again.',
    );
    expect(alert).toBeVisible();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(loginStyles.alertMessage);
  });

  test('shows a generic authentication error alert for other error codes in the callback URL', () => {
    renderLogin({
      initialEntries: ['/login?error=server_error&error_description=Something+went+wrong'],
    });

    const alert = screen.getByText('Authentication error: Something went wrong');
    expect(alert).toBeVisible();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(loginStyles.alertMessage);
  });

  test('renders the EULA link with href, new-tab behavior, and an accessible name when the EULA feature is enabled', () => {
    store = mockStore({
      data: { eula: { eula_url: 'https://example.com/eula' } },
      view: {
        systemConfig: { [SYSTEM_CONFIG_FLAGS.EULA]: true },
      },
    });

    renderLogin();

    const link = screen.getByRole('link', { name: 'EarthRanger EULA (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://example.com/eula');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass(loginStyles.eulaLink);
  });

  test('does not render the EULA link when the EULA feature is disabled', () => {
    store = mockStore({
      data: { eula: { eula_url: 'https://example.com/eula' } },
      view: {
        systemConfig: { [SYSTEM_CONFIG_FLAGS.EULA]: false },
      },
    });

    renderLogin();

    expect(screen.queryByRole('link', { name: 'EarthRanger EULA (opens in a new tab)' })).not.toBeInTheDocument();
  });
});
