import { useEffect, useId, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EcoscopeLogoIcon } from '../../common/images/icons/ecoscope-logo.svg';

import { ECOSCOPE_CONNECTION_KEY, ECOSCOPE_LOGOUT_EVENT, requestEcoscopeLaunch } from '../../utils/ecoscope';
import { REACT_APP_ECOSCOPE_URL } from '../../constants';
import useNavigate from '../../hooks/useNavigate';

import * as styles from './styles.module.scss';

const EcoscopeTab = ({ isActive }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.ecoscopeTab' });

  const navigate = useNavigate();

  const accessToken = useSelector((state) => state.data.token?.access_token);

  const accessTokenRef = useRef(accessToken);
  const controllerRef = useRef(null);
  const formRef = useRef(null);
  const launchCodeRef = useRef(null);

  const frameName = useId();

  const [attempt, setAttempt] = useState(0);
  const [hasBeenActivated, setHasBeenActivated] = useState(isActive);
  const [hasConnectionEnded, setHasConnectionEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [launch, setLaunch] = useState(null);

  if (isActive && !hasBeenActivated && !hasConnectionEnded) setHasBeenActivated(true);

  const onFrameLoad = () => {
    if (launchCodeRef.current && formRef.current) {
      formRef.current.elements.code.value = launchCodeRef.current;
      launchCodeRef.current = null;
      formRef.current.submit();
      formRef.current.elements.code.value = '';
    }
  };

  const onRetryClick = () => {
    accessTokenRef.current = accessToken;
    setHasError(false);
    setLaunch(null);
    setAttempt(attempt + 1);
  };

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!hasBeenActivated || hasConnectionEnded) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    requestEcoscopeLaunch(accessTokenRef.current, AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]))
      .then((response) => {
        if (!controller.signal.aborted) {
          launchCodeRef.current = response.code;
          setLaunch({ transaction_id: response.transaction_id });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasError(true);
      });

    return () => {
      controller.abort();
      launchCodeRef.current = null;
    };
  }, [attempt, hasBeenActivated, hasConnectionEnded]);

  useEffect(() => {
    const onLogout = () => {
      controllerRef.current?.abort();
      launchCodeRef.current = null;
      setHasConnectionEnded(true);
      setLaunch(null);
      if (isActive) navigate('/', { replace: true });
    };
    const onStorage = (event) => {
      if (event.key === null
        || (event.key === ECOSCOPE_CONNECTION_KEY && event.oldValue && event.newValue !== event.oldValue)) {
        onLogout();
      }
    };
    window.addEventListener(ECOSCOPE_LOGOUT_EVENT, onLogout);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ECOSCOPE_LOGOUT_EVENT, onLogout);
      window.removeEventListener('storage', onStorage);
    };
  }, [isActive, navigate]);

  if (!hasBeenActivated || hasConnectionEnded) return null;

  return <section
    aria-label={t('workspaceLabel')}
    className={styles.ecoscopeTab}
    hidden={!isActive}
    inert={!isActive}
  >
    <header className={styles.header}>
      <div className={styles.brand}>
        <EcoscopeLogoIcon aria-hidden="true" />

        <div><h2>{t('analysisTitle')}</h2><span>{t('providerLabel')}</span></div>
      </div>
    </header>

    {!launch && !hasError && <p className={styles.status} role="status">{t('loadingMessage')}</p>}

    {hasError && <div className={styles.status}>
      <p role="alert">{t('launchErrorMessage')}</p>

      <button className={styles.retryButton} onClick={onRetryClick} type="button">{t('retryButtonLabel')}</button>
    </div>}

    {launch && <>
      <iframe
        className={styles.frame}
        key={launch.transaction_id}
        name={frameName}
        onLoad={onFrameLoad}
        referrerPolicy="no-referrer"
        src={`${REACT_APP_ECOSCOPE_URL}/er/prepare?transaction_id=${encodeURIComponent(launch.transaction_id)}`}
        title={t('frameTitle')}
      />

      <form action={`${REACT_APP_ECOSCOPE_URL}/er/launch`} hidden method="post" ref={formRef} target={frameName}>
        <input name="transaction_id" type="hidden" value={launch.transaction_id} />

        <input defaultValue="" name="code" type="hidden" />
      </form>
    </>}
  </section>;
};

export default EcoscopeTab;
