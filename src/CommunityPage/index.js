import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo.svg';
import { ReactComponent as ReportTypeIconSprite } from '../common/images/sprites/event-svg-sprite.svg';

import { fetchEventsSchema } from '../ducks/event-schemas';
import { fetchEventTypes } from '../ducks/event-types';
import { SidebarScrollProvider } from '../SidebarScrollContext';
import { uuid } from '../utils/string';

import ReportManager from '../ReportManager';
import SearchBar from '../SearchBar';
import TypesList from '../AddItemButton/AddItemModal/TypesList';

import * as styles from './styles.module.scss';

const CommunityPage = () => {
  const { t } = useTranslation('components', { keyPrefix: 'communityPage' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { value, '*': eventTypeValue } = useParams();

  const allEventTypes = useSelector((state) => state.data.eventTypes);
  const eventsByCategory = useMemo(() => {
    const creatableTypes = allEventTypes.filter((t) => !t.is_collection && !t.readonly);
    return creatableTypes.length ? [{ value: 'all', display: '', types: creatableTypes }] : [];
  }, [allEventTypes]);

  const [searchText, setSearchText] = useState('');
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const typesListRef = useRef(null);
  const temporalIdRef = useRef(null);
  const prevEventTypeValueRef = useRef(null);

  if (eventTypeValue !== prevEventTypeValueRef.current) {
    prevEventTypeValueRef.current = eventTypeValue;
    temporalIdRef.current = eventTypeValue ? uuid() : null;
  }

  const selectedType = useMemo(() => {
    if (!eventTypeValue) return null;
    const matchingType = allEventTypes.find((t) => t.value === eventTypeValue);
    if (!matchingType) return null;
    return { id: matchingType.id, temporalId: temporalIdRef.current };
  }, [allEventTypes, eventTypeValue]);

  useEffect(() => {
    setIsLoading(true);
    setIsUnauthorized(false);
    dispatch(fetchEventTypes({ community_input: value }, { skipAuth: true }))
      .then(() => setIsLoading(false))
      .catch((e) => {
        if (e?.response?.status === 401) {
          setIsUnauthorized(true);
        } else {
          setIsLoading(false);
        }
      });
    dispatch(fetchEventsSchema({ community_input: value }, { skipAuth: true }));
  }, [dispatch, value]);

  useEffect(() => {
    if (isLoading || isUnauthorized || eventTypeValue) return;
    const creatableTypes = allEventTypes.filter((t) => !t.is_collection && !t.readonly);
    if (creatableTypes.length === 1) {
      navigate(`/community/${value}/${creatableTypes[0].value}`, { replace: true });
    }
  }, [allEventTypes, eventTypeValue, isLoading, isUnauthorized, navigate, value]);

  const schemaFetchExtraParams = useMemo(() => ({ community_input: value }), [value]);
  const schemaFetchAxiosConfig = useMemo(() => ({ skipAuth: true }), []);

  const onClickType = useCallback((reportType) => {
    navigate(`/community/${value}/${reportType.value}`);
  }, [navigate, value]);

  const onBack = useCallback(() => {
    navigate(`/community/${value}`);
    setShowSubmittedModal(true);
    setTimeout(() => setShowSubmittedModal(false), 3000);
  }, [navigate, value]);

  return <SidebarScrollProvider>
    <div style={{ display: 'none', height: 0, width: 0 }}>
      <ReportTypeIconSprite id="reportTypeIconSprite" />
    </div>

    <Modal centered show={showSubmittedModal} onHide={() => setShowSubmittedModal(false)}>
      <Modal.Header closeButton />
      <Modal.Body className={styles.submittedModalBody}>{t('formSubmitted')}</Modal.Body>
    </Modal>

    <div className={styles.pageContainer}>
      {(isLoading || (!eventTypeValue && !isUnauthorized && eventsByCategory[0]?.types.length === 1))
        ? <div className={styles.loadingView}>
            {isUnauthorized
              ? <EarthRangerLogo className={styles.earthRangerLogo} />
              : <MoonLoader color="#333" size={50} />
            }
            {isUnauthorized && <span className={styles.loadingError}>{t('invalidCommunityUrl')}</span>}
          </div>
        : selectedType
          ? <ReportManager
                fallbackPath={`/community/${value}`}
                hidePriority
                hideReportedBy
                isCommunity
                newReportTypeId={selectedType.id}
                reportId={selectedType.temporalId}
                onBack={onBack}
                saveExtraParams={schemaFetchExtraParams}
                schemaFetchAxiosConfig={schemaFetchAxiosConfig}
                schemaFetchExtraParams={schemaFetchExtraParams}
              />
          : <div className={styles.communityPage}>
              <h2 className={styles.heading}>{value}</h2>

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
                ref={typesListRef}
                typesByCategory={eventsByCategory}
              />
            </div>
      }
    </div>
  </SidebarScrollProvider>;
};

export default memo(CommunityPage);
