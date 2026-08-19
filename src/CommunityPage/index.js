import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import {
  COOL_OFF_STORAGE_KEY,
  getCoolOffExpiry,
  readCoolOffEntries,
  recordCoolOffSubmission,
} from '../utils/community-cool-off';
import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo.svg';
import {
  durationHumanizer,
  HUMANIZED_DURATION_CONFIGS,
  resolveDurationHumanizerLanguage,
} from '../utils/datetime';
import { fetchCommunityInfo } from '../ducks/community';
import { fetchEventsSchema } from '../ducks/event-schemas';
import { fetchEventTypes } from '../ducks/event-types';
import { SidebarScrollProvider } from '../SidebarScrollContext';
import { uuid } from '../utils/string';

import ReportManager from '../ReportManager';
import SearchBar from '../SearchBar';
import TypesList from '../AddItemButton/AddItemModal/TypesList';

import * as styles from './styles.module.scss';

const SUBMITTED_MODAL_TIMEOUT = 3000;
const COOL_OFF_TICK_INTERVAL = 1000;
const ONE_MINUTE_IN_MS = 60 * 1000;
// A longer delay overflows setTimeout's signed 32 bit field and fires immediately.
const MAX_TIMEOUT_MS = (2 ** 31) - 1;

const CommunityPage = () => {
  const { t, i18n: { language } } = useTranslation('components', { keyPrefix: 'communityPage' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { value, '*': eventTypeValue } = useParams();

  const allEventTypes = useSelector((state) => state.data.eventTypes);
  const community = useSelector((state) => state.data.community);

  const creatableEventTypes = useMemo(
    () => allEventTypes.filter((eventType) => !eventType.is_collection && !eventType.readonly),
    [allEventTypes],
  );

  const eventsByCategory = useMemo(
    () => (creatableEventTypes.length ? [{ value: 'all', display: '', types: creatableEventTypes }] : []),
    [creatableEventTypes],
  );

  const [searchText, setSearchText] = useState('');
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [coolOffEntries, setCoolOffEntries] = useState(readCoolOffEntries);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const timeoutRef = useRef(null);
  const pageContainerRef = useRef(null);
  const coolOffTitleRef = useRef(null);
  const wasInCoolOffRef = useRef(false);
  const handledCoolOffExpiryRef = useRef(null);

  // formResetKey is an intentional trigger: bumping it regenerates a fresh temporalId (form reset)
  // even though it isn't read in the callback body.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const temporalId = useMemo(() => (eventTypeValue ? uuid() : null), [eventTypeValue, formResetKey]);

  const selectedType = useMemo(() => {
    if (!eventTypeValue) return null;
    const matchingType = allEventTypes.find((eventType) => eventType.value === eventTypeValue);
    if (!matchingType) return null;
    return { display: matchingType.display, id: matchingType.id, temporalId };
  }, [allEventTypes, eventTypeValue, temporalId]);

  const loadCommunityData = useCallback(() => Promise.allSettled([
    dispatch(fetchCommunityInfo(value)),
    dispatch(fetchEventTypes(value)),
  ]), [dispatch, value]);

  useEffect(() => {
    if (!value) {
      setIsLoading(false);
      setIsUnauthorized(true);
      return;
    }
    setIsLoading(true);
    setIsUnauthorized(false);
    loadCommunityData().then(([communityResult]) => {
      if (communityResult.status === 'rejected') {
        setIsUnauthorized(true);
      }
      setIsLoading(false);
    });
    dispatch(fetchEventsSchema(value));
  }, [dispatch, loadCommunityData, value]);

  useEffect(() => {
    if (isLoading || isUnauthorized || eventTypeValue) return;
    if (creatableEventTypes.length === 1) {
      navigate(`/community/${value}/${creatableEventTypes[0].value}`, { replace: true });
    }
  }, [creatableEventTypes, eventTypeValue, isLoading, isUnauthorized, navigate, value]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  // Storage is shared, so another tab may have started a cool-off since this one last read it.
  useEffect(() => {
    const syncCoolOffEntries = () => {
      setCoolOffEntries(readCoolOffEntries());
      setNowMs(Date.now());
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncCoolOffEntries();
    };

    const onStorage = ({ key }) => {
      if (key === COOL_OFF_STORAGE_KEY || key === null) syncCoolOffEntries();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', syncCoolOffEntries);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', syncCoolOffEntries);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const coolOffPeriodMinutes = community?.cool_off_period_minutes ?? 0;

  // The stored entries hold submission times only; the live period from the community payload is
  // what turns one into a window, so a changed setting applies from the next payload fetch.
  const coolOffExpiresAt = useMemo(
    () => getCoolOffExpiry(coolOffEntries, value, eventTypeValue, coolOffPeriodMinutes),
    [coolOffEntries, coolOffPeriodMinutes, eventTypeValue, value],
  );

  const coolOffExpiryByType = useMemo(
    () => creatableEventTypes.reduce((expiries, eventType) => {
      const expiresAt = getCoolOffExpiry(coolOffEntries, value, eventType.value, coolOffPeriodMinutes);
      if (expiresAt) expiries[eventType.value] = expiresAt;

      return expiries;
    }, {}),
    [coolOffEntries, coolOffPeriodMinutes, creatableEventTypes, value],
  );

  // Only what is on screen needs a clock: the notice while a type is selected, the annotated type
  // list otherwise.
  const nextCoolOffExpiry = useMemo(() => {
    const pending = (eventTypeValue ? [coolOffExpiresAt] : Object.values(coolOffExpiryByType))
      .filter((expiresAt) => expiresAt > nowMs);

    return pending.length ? Math.min(...pending) : null;
  }, [coolOffExpiresAt, coolOffExpiryByType, eventTypeValue, nowMs]);

  const onCoolOffEnd = useCallback((expiresAt) => {
    if (Date.now() < expiresAt || handledCoolOffExpiryRef.current === expiresAt) return;
    handledCoolOffExpiryRef.current = expiresAt;

    // A changed cool_off_period_minutes or event type list should take effect without a reload,
    // and the form the notice replaced has to come back clean.
    loadCommunityData();
    setFormResetKey((key) => key + 1);
  }, [loadCommunityData]);

  useEffect(() => {
    if (!nextCoolOffExpiry) return;

    const msUntilExpiry = nextCoolOffExpiry - Date.now();
    if (msUntilExpiry <= 0) return;

    const tick = setInterval(() => {
      setNowMs(Date.now());
      if (Date.now() >= nextCoolOffExpiry) clearInterval(tick);
    }, COOL_OFF_TICK_INTERVAL);

    // The tick alone would lift the block up to a second late, so land on the deadline itself too.
    const deadline = setTimeout(() => {
      setNowMs(Date.now());
      onCoolOffEnd(nextCoolOffExpiry);
    }, Math.min(msUntilExpiry, MAX_TIMEOUT_MS));

    return () => {
      clearInterval(tick);
      clearTimeout(deadline);
    };
  }, [nextCoolOffExpiry, onCoolOffEnd]);

  const coolOffRemainingMs = coolOffExpiresAt ? Math.max(0, coolOffExpiresAt - nowMs) : 0;
  const isInCoolOff = coolOffRemainingMs > 0;

  const humanizeCoolOffDuration = useMemo(
    () => durationHumanizer(HUMANIZED_DURATION_CONFIGS.FULL_FORMAT(resolveDurationHumanizerLanguage(language))),
    [language],
  );

  const coolOffRemainingText = useMemo(
    () => humanizeCoolOffDuration(Math.ceil(coolOffRemainingMs / 1000) * 1000),
    [coolOffRemainingMs, humanizeCoolOffDuration],
  );

  // Rounding to the minute is what keeps the live region from interrupting a screen reader on
  // every tick: the announced text only changes once a minute.
  const coolOffAnnouncement = useMemo(() => (isInCoolOff ? t('coolOffTimeRemaining', {
    timeRemaining: humanizeCoolOffDuration(Math.ceil(coolOffRemainingMs / ONE_MINUTE_IN_MS) * ONE_MINUTE_IN_MS),
  }) : ''), [coolOffRemainingMs, humanizeCoolOffDuration, isInCoolOff, t]);

  // The notice and the form replace one another outright, so focus would otherwise drop to <body>
  // in both directions.
  useEffect(() => {
    if (isInCoolOff) {
      coolOffTitleRef.current?.focus();
    } else if (wasInCoolOffRef.current) {
      pageContainerRef.current?.focus();
    }

    wasInCoolOffRef.current = isInCoolOff;
  }, [isInCoolOff]);

  const getTypeUnavailableReason = useCallback((eventType) => {
    const expiresAt = coolOffExpiryByType[eventType.value];
    if (!expiresAt || expiresAt <= nowMs) return null;

    return t('coolOffTypeUnavailable', {
      timeRemaining: humanizeCoolOffDuration(Math.ceil((expiresAt - nowMs) / ONE_MINUTE_IN_MS) * ONE_MINUTE_IN_MS),
    });
  }, [coolOffExpiryByType, humanizeCoolOffDuration, nowMs, t]);

  const onClickType = useCallback((reportType) => {
    navigate(`/community/${value}/${reportType.value}`);
  }, [navigate, value]);

  const onClickChooseAnotherType = useCallback(() => {
    navigate(`/community/${value}`);
  }, [navigate, value]);

  const onBack = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShowSubmittedModal(true);
    timeoutRef.current = setTimeout(() => setShowSubmittedModal(false), SUBMITTED_MODAL_TIMEOUT);

    setCoolOffEntries(recordCoolOffSubmission(value, eventTypeValue, coolOffPeriodMinutes));
    // Resync after recording, so the first countdown render can't read a clock older than the
    // expiry it is measured against.
    setNowMs(Date.now());

    if (creatableEventTypes.length === 1) {
      // Only one creatable type: there's no list to return to, so refresh the form in place
      // (bump the reset key → new temporalId → ReportManager remounts) instead of navigating to
      // /community/:value, which would immediately auto-redirect back here.
      setFormResetKey((key) => key + 1);
    } else {
      navigate(`/community/${value}`);
    }
  }, [coolOffPeriodMinutes, creatableEventTypes.length, eventTypeValue, navigate, value]);

  const isRedirectingToOnlyType = !eventTypeValue && !isUnauthorized && eventsByCategory[0]?.types.length === 1;

  let content;
  if (isUnauthorized) {
    content = (
      <div className={styles.loadingView}>
        <EarthRangerLogo className={styles.earthRangerLogo} />

        <span className={styles.loadingError}>{t('invalidCommunityUrl')}</span>
      </div>
    );
  } else if (isLoading || isRedirectingToOnlyType) {
    content = (
      <div className={styles.loadingView}>
        <MoonLoader color="#333" size={50} />
      </div>
    );
  } else if (selectedType && isInCoolOff) {
    content = (
      <div className={styles.communityPage}>
        <h2 className={styles.heading}>{community?.name}</h2>

        <div className={styles.coolOffNotice}>
          <ClockIcon aria-hidden className={styles.coolOffIcon} />

          <h3 className={styles.coolOffTitle} ref={coolOffTitleRef} tabIndex={-1}>{t('coolOffTitle')}</h3>

          <p className={styles.coolOffMessage}>
            {t('coolOffMessage', { eventType: selectedType.display, timeRemaining: coolOffRemainingText })}
          </p>

          {creatableEventTypes.length > 1 && <Button
            className={styles.coolOffBackButton}
            onClick={onClickChooseAnotherType}
            variant="primary"
          >
            {t('coolOffChooseAnotherType')}
          </Button>}
        </div>

        <span aria-live="polite" className="visually-hidden">{coolOffAnnouncement}</span>
      </div>
    );
  } else if (selectedType) {
    content = (
      <ReportManager
        fallbackPath={`/community/${value}`}
        hidePriority
        hideReportedBy
        isCommunity
        newReportTypeId={selectedType.id}
        reportId={selectedType.temporalId}
        onBack={onBack}
        communityInputValue={value}
      />
    );
  } else {
    content = (
      <div className={styles.communityPage}>
        <h2 className={styles.heading}>{community?.name}</h2>

        <div className={styles.searchControls}>
          <SearchBar
            onChange={(e) => setSearchText(e.target.value)}
            onClear={() => setSearchText('')}
            placeholder={t('searchPlaceholder')}
            value={searchText}
          />
        </div>

        <TypesList
          filterText={searchText}
          getTypeUnavailableReason={getTypeUnavailableReason}
          onClickType={onClickType}
          typesByCategory={eventsByCategory}
        />
      </div>
    );
  }

  return <SidebarScrollProvider>
    <Modal centered show={showSubmittedModal} onHide={() => setShowSubmittedModal(false)}>
      <Modal.Header closeButton />
      <Modal.Body className={styles.submittedModalBody}>{t('formSubmitted')}</Modal.Body>
    </Modal>

    <div className={styles.pageContainer} ref={pageContainerRef} tabIndex={-1}>
      {content}
    </div>
  </SidebarScrollProvider>;
};

export default memo(CommunityPage);
