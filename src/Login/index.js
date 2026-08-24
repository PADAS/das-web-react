import React, { useCallback, useEffect, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  ReactComponent as EarthRangerLogo,
} from '../common/images/earth-ranger-logo.svg';

import { ACCOUNT_LINKER_URL, SYSTEM_CONFIG_FLAGS } from '../constants';
import { APP_ROUTES } from '../constants/routes';
import appConfig from '../config';
import { buildAuth0AuthorizationParams } from '../utils/auth0';
import { clearAuth, postAuth } from '../ducks/auth';
import { fetchEula } from '../ducks/eula';
import {
  markLocalUserLoginAttempt,
  stripAuth0Params,
  takeLocalUserLoginAttempt,
  takeLocalUserNotProvisioned,
} from '../utils/auth';
import useNavigate from '../hooks/useNavigate';

import * as styles from './styles.module.scss';

const SUBMIT_LOADER_SIZE = 18;

const LoginPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    loginWithRedirect: auth0LoginWithRedirect,
    isLoading: isAuth0Loading,
  } = useAuth0();
  const navigate = useNavigate();
  const { t } = useTranslation('login');

  const eulaURL = useSelector((state) => state.data.eula.eula_url);
  const systemConfig = useSelector((state) => state.view.systemConfig);

  const passwordInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  // Holds a translation key, not a translated string: the namespace may still be
  // loading at mount, and a stored string would keep whatever `t` returned then —
  // the raw key — for the life of the page, and would not follow a language change.
  //
  // Initialized from router state (no effect/flicker): Auth0TokenManager routes
  // here when the post-Auth0 handling fails, saying whether a local-user attempt
  // was behind it so the message can name that path rather than hide it.
  const [alert, setAlert] = useState(() => {
    if (location.state?.localUserSignInFailed) {
      return { key: 'errorAlert.localUserSignInFailed' };
    }
    return location.state?.authLinkingError ? { key: 'errorAlert.signInIncomplete' } : null;
  });
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [formErrors, setFormErrors] = useState({ username: null, password: null });
  const [isLoading, setIsLoading] = useState(false);

  const idpOrgId = systemConfig?.idp_org_id?.trim() || null;
  const isEULAEnabled = !!systemConfig?.[SYSTEM_CONFIG_FLAGS.EULA];
  const requireIdp = !!systemConfig?.require_idp;
  const siteSlug = systemConfig?.site_slug?.trim() || null;

  // Without the slug the redirect would omit the connection and sign the user
  // into the common database instead — a wrong account, not a visible error. The
  // org check keeps the offer to sites where Auth0TokenManager's account-linking
  // gate runs, which is what catches a local user with no ER account behind it.
  const canSignInAsLocalUser = !!systemConfig?.support_managed_users
    && !!siteSlug
    && !idpOrgId;

  const onAuth0Login = useCallback(async () => {
    try {
      await auth0LoginWithRedirect({
        authorizationParams: buildAuth0AuthorizationParams(appConfig.auth0.audience, idpOrgId),
      });
    } catch (_error) {
      setAlert({ key: 'errorAlert.signInFailed' });
    }
  }, [auth0LoginWithRedirect, idpOrgId]);

  const onLocalUserLogin = useCallback(async () => {
    markLocalUserLoginAttempt();

    try {
      await auth0LoginWithRedirect({
        authorizationParams: buildAuth0AuthorizationParams(
          appConfig.auth0.audience,
          idpOrgId,
          siteSlug,
        ),
      });
    } catch (_error) {
      // The page never left, so there is no attempt in flight for a later failure
      // to be attributed to.
      takeLocalUserLoginAttempt();
      setAlert({ key: 'errorAlert.signInFailed' });
    }
  }, [auth0LoginWithRedirect, idpOrgId, siteSlug]);

  const onFormSubmit = useCallback(async (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password.trim();
    const errors = {
      username: username ? null : t('errors.usernameRequired'),
      password: password ? null : t('errors.passwordRequired'),
    };

    if (errors.username) {
      usernameInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }

    if (errors.username || errors.password) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({ username: null, password: null });
    setIsLoading(true);

    try {
      await dispatch(postAuth({ username, password }));
      const options = location.state?.from
        ? { state: { comesFromLogin: true } }
        : {};
      navigate(
        location.state?.from
          || { pathname: APP_ROUTES.ROOT, search: location.search },
        options
      );
    } catch (error) {
      dispatch(clearAuth());
      const invalidCredentials = error.toJSON()?.message?.includes('400');

      if (invalidCredentials) {
        usernameInputRef.current?.select();
      }

      setAlert({
        key: invalidCredentials
          ? 'errorAlert.invalidCredentialsMessage'
          : 'errorAlert.unknownErrorMessage',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, formData, location, navigate, t]);

  const onInputChange = useCallback((event) => {
    setFormData((prevFormData) => ({ ...prevFormData, [event.target.name]: event.target.value }));
    setFormErrors((prevFormErrors) => (prevFormErrors[event.target.name]
      ? { ...prevFormErrors, [event.target.name]: null }
      : prevFormErrors));
    setAlert(null);
  }, []);

  // Mount work, kept apart from the effect below: that one re-runs when the Auth0
  // params are stripped from the URL, which would otherwise refetch the EULA and
  // clear auth a second time.
  useEffect(() => {
    dispatch(clearAuth());
    dispatch(fetchEula());
  }, [dispatch]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const auth0Error = urlParams.get('error');
    const auth0ErrorDescription = urlParams.get('error_description');
    // Consumed on every visit rather than only on failures, so a marker left
    // behind by an earlier attempt cannot mislabel a later common-path failure.
    // Safe to read plainly: stripping the params below re-runs this effect, but
    // with no error left to attribute, so a spent marker is never consulted again.
    const attemptedLocalUserLogin = takeLocalUserLoginAttempt();

    // Set before Auth0TokenManager signed this local user out of Auth0, because
    // that redirect leaves the app and takes router state with it. Consuming it
    // on a later run is harmless: an unset flag simply leaves the alert alone.
    const localUserNotProvisioned = takeLocalUserNotProvisioned();

    // Keyed off the error code alone: a description is optional in OAuth 2.0, and
    // requiring one would silently drop the whole message for a bare `error=…`.
    if (localUserNotProvisioned || auth0Error) {
      // Pick the message from how the user arrived, in one place so the effect
      // performs a single state update.
      const alertForArrival = () => {
        if (localUserNotProvisioned) {
          return { key: 'errorAlert.localUserNotProvisioned' };
        }
        // Auth0's error text is not a contract, so a local-user failure names the
        // path that failed rather than claiming a cause.
        if (attemptedLocalUserLogin) {
          return { key: 'errorAlert.localUserSignInFailed' };
        }
        if (auth0Error === 'access_denied') {
          return auth0ErrorDescription?.includes('not part of the')
            ? { key: 'errorAlert.accessDeniedNotAuthorized' }
            : { key: 'errorAlert.accessDeniedNoPermission' };
        }
        if (auth0Error === 'unauthorized') {
          return { key: 'errorAlert.authenticationFailed' };
        }
        return auth0ErrorDescription
          ? {
            key: 'errorAlert.authenticationError',
            values: { errorDescription: auth0ErrorDescription },
          }
          : { key: 'errorAlert.unknownErrorMessage' };
      };

      // Derived from the URL and from storage, neither of which React can observe,
      // so this is the one place the message can be set.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlert(alertForArrival());

      if (auth0Error) {
        // Drop the params now that the message is chosen. The marker behind it is
        // single-use, so reloading this URL would fall through to a generic message
        // asserting a cause we have no way to know. Uses the shared helper so only
        // the Auth0 params go, matching how the token manager strips them.
        navigate(
          stripAuth0Params(`${location.pathname}${location.search}`),
          { replace: true, state: location.state },
        );
      }
    }
  }, [dispatch, location.pathname, location.search, location.state, navigate]);

  return <div className={styles.container}>
    <EarthRangerLogo aria-label="EarthRanger" className={styles.logo} role="img" />

    <h1 className={styles.srOnly}>{t('title')}</h1>

    {/* Auth0 migration guidance: shown only on common-DB sites (require_idp with
        no idp_org_id). "Sign in with email" below auto-drives EarthRanger
        Identity; users who have not converted their account yet are linked to
        the server account linker. Org-scoped sites show no box. */}
    {requireIdp && !idpOrgId && (
      <section className={styles.infoBox} aria-labelledby="auth0-info-title">
        <h2 className={styles.infoBoxTitle} id="auth0-info-title">
          {t('auth0Info.title')}
        </h2>

        <p className={styles.infoBoxBody}>{t('auth0Info.intro')}</p>
        <p className={styles.infoBoxBody}>{t('auth0Info.signInPrompt')}</p>

        {canSignInAsLocalUser && (
          <p className={styles.infoBoxBody}>{t('auth0Info.localUserPrompt')}</p>
        )}

        <p className={styles.infoBoxBody}>{t('auth0Info.convertPrompt')}</p>
        <a className={styles.infoBoxLink} href={ACCOUNT_LINKER_URL}>
          {t('auth0Info.convertLink')}
        </a>

        <p className={styles.helperText}>{t('auth0Info.helpText')}</p>
      </section>
    )}

    {requireIdp ? (
      <div className={styles.form}>
        <button
          aria-busy={isAuth0Loading}
          aria-label={isAuth0Loading ? t('loginButtonLoadingLabel') : undefined}
          className={styles.loginButton}
          disabled={isAuth0Loading}
          onClick={onAuth0Login}
          type="button"
        >
          {isAuth0Loading
            ? <MoonLoader aria-hidden color="white" size={SUBMIT_LOADER_SIZE} />
            : t(idpOrgId ? 'loginButtonIdp' : 'loginButtonEmail')}
        </button>

        {canSignInAsLocalUser && (
          <button
            aria-busy={isAuth0Loading}
            className={`${styles.loginButton} ${styles.secondaryButton}`}
            disabled={isAuth0Loading}
            onClick={onLocalUserLogin}
            type="button"
          >
            {t('loginButtonLocalUser')}
          </button>
        )}
      </div>
    ) : (
      <form className={styles.form} noValidate onSubmit={onFormSubmit}>
        <label className={`${styles.label} ${formErrors.username ? styles.error : ''}`} htmlFor="username">
          {t('usernameLabel')}
        </label>

        <input
          aria-errormessage={formErrors.username ? 'username-error' : undefined}
          aria-invalid={formErrors.username ? 'true' : undefined}
          autoComplete="username"
          className={styles.input}
          id="username"
          name="username"
          onChange={onInputChange}
          ref={usernameInputRef}
          required
          type="text"
          value={formData.username}
        />
        {formErrors.username && (
          <p className={styles.errorMessage} id="username-error" role="alert">
            {formErrors.username}
          </p>
        )}

        <label className={`${styles.label} ${formErrors.password ? styles.error : ''}`} htmlFor="password">
          {t('passwordLabel')}
        </label>

        <input
          aria-errormessage={formErrors.password ? 'password-error' : undefined}
          aria-invalid={formErrors.password ? 'true' : undefined}
          autoComplete="current-password"
          className={styles.input}
          id="password"
          name="password"
          onChange={onInputChange}
          ref={passwordInputRef}
          required
          type="password"
          value={formData.password}
        />
        {formErrors.password && (
          <p className={styles.errorMessage} id="password-error" role="alert">
            {formErrors.password}
          </p>
        )}

        <button
          aria-busy={isLoading}
          aria-label={isLoading ? t('loginButtonLoadingLabel') : undefined}
          className={styles.loginButton}
          disabled={isLoading}
          type="submit"
        >
          {isLoading
            ? <MoonLoader aria-hidden color="white" size={SUBMIT_LOADER_SIZE} />
            : t('loginButton')}
        </button>
      </form>
    )}

    {!!alert && <div role="alert" className={styles.alertMessage}>{t(alert.key, alert.values)}</div>}

    {isEULAEnabled && <a
      aria-label={t('eulaLinkLabel')}
      className={styles.eulaLink}
      href={eulaURL}
      rel="noopener noreferrer"
      target="_blank"
    >
      {t('eulaLink')}
    </a>}
  </div>;
};

export default LoginPage;
