import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo.svg';
import { fetchCommunityInfo } from '../ducks/community';
import { fetchEventsSchema } from '../ducks/event-schemas';
import { fetchEventTypes } from '../ducks/event-types';
import { probeGeolocationPermission } from '../utils/location/permission-probe';
import { SidebarScrollProvider } from '../SidebarScrollContext';
import { uuid } from '../utils/string';

import ReportManager from '../ReportManager';
import SearchBar from '../SearchBar';
import TypesList from '../AddItemButton/AddItemModal/TypesList';

import * as styles from './styles.module.scss';

const SUBMITTED_MODAL_TIMEOUT = 3000;

const CommunityPage = () => {
  const { t } = useTranslation('components', { keyPrefix: 'communityPage' });
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
  const timeoutRef = useRef(null);

  // formResetKey is an intentional trigger: bumping it regenerates a fresh temporalId (form reset)
  // even though it isn't read in the callback body.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const temporalId = useMemo(() => (eventTypeValue ? uuid() : null), [eventTypeValue, formResetKey]);

  const selectedType = useMemo(() => {
    if (!eventTypeValue) return null;
    const matchingType = allEventTypes.find((eventType) => eventType.value === eventTypeValue);
    if (!matchingType) return null;
    return { id: matchingType.id, temporalId };
  }, [allEventTypes, eventTypeValue, temporalId]);

  useEffect(() => {
    if (!value) {
      setIsLoading(false);
      setIsUnauthorized(true);
      return;
    }
    setIsLoading(true);
    setIsUnauthorized(false);
    Promise.allSettled([
      dispatch(fetchCommunityInfo(value)),
      dispatch(fetchEventTypes(value)),
    ]).then(([communityResult]) => {
      if (communityResult.status === 'rejected') {
        setIsUnauthorized(true);
      }
      setIsLoading(false);
    });
    dispatch(fetchEventsSchema(value));
  }, [dispatch, value]);

  useEffect(() => {
    if (isLoading || isUnauthorized || eventTypeValue) return;
    if (creatableEventTypes.length === 1) {
      navigate(`/community/${value}/${creatableEventTypes[0].value}`, { replace: true });
    }
  }, [creatableEventTypes, eventTypeValue, isLoading, isUnauthorized, navigate, value]);

  useEffect(() => {
    // Without the Permissions API a read attempt is the only way to learn the geolocation state, and doing
    // it at load means the location picker knows the answer by the time it opens.
    if (!window.navigator.permissions?.query) {
      probeGeolocationPermission();
    }
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const onClickType = useCallback((reportType) => {
    navigate(`/community/${value}/${reportType.value}`);
  }, [navigate, value]);

  const onBack = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShowSubmittedModal(true);
    timeoutRef.current = setTimeout(() => setShowSubmittedModal(false), SUBMITTED_MODAL_TIMEOUT);

    if (creatableEventTypes.length === 1) {
      // Only one creatable type: there's no list to return to, so refresh the form in place
      // (bump the reset key → new temporalId → ReportManager remounts) instead of navigating to
      // /community/:value, which would immediately auto-redirect back here.
      setFormResetKey((key) => key + 1);
    } else {
      navigate(`/community/${value}`);
    }
  }, [creatableEventTypes.length, navigate, value]);

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

    <div className={styles.pageContainer}>
      {content}
    </div>
  </SidebarScrollProvider>;
};

export default memo(CommunityPage);
