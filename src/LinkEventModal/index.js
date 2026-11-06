import { useId, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import InfiniteScroll from 'react-infinite-scroller';
import Modal from 'react-bootstrap/Modal';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';

import { EVENT_LINK_TARGET_TYPES, FOCUSABLE_SELECTOR } from '../constants';
import useLinkTargets from './utils/useLinkTargets';
import useReport from '../hooks/useReport';

import DetailViewLoader from '../SideBar/DetailViewLoader';
import ErrorMessage from '../ErrorMessage';
import IncidentOption from './IncidentOption';
import PatrolOption from './PatrolOption';
import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 18;

export const SEARCH_DEBOUNCE_DELAY = 200;

// The browser lets Tab leave the last control, so focus wraps around instead.
const keepFocusInside = (keyEvent) => {
  if (keyEvent.key === 'Tab') {
    const focusableElements = [...keyEvent.currentTarget.querySelectorAll(FOCUSABLE_SELECTOR)]
      .filter((element) => element.tabIndex >= 0);
    const edgeElement = keyEvent.shiftKey ? focusableElements[0] : focusableElements.at(-1);
    if (document.activeElement === edgeElement) {
      keyEvent.preventDefault();

      (keyEvent.shiftKey ? focusableElements.at(-1) : focusableElements[0])?.focus();
    }
  }
};

const renderIncidentOption = (incident, optionProps) => <IncidentOption
  incident={incident}
  key={incident.id}
  {...optionProps}
/>;

const renderPatrolOption = (patrol, optionProps) => <PatrolOption key={patrol.id} patrol={patrol} {...optionProps} />;

const RENDER_OPTION_BY_TYPE = {
  [EVENT_LINK_TARGET_TYPES.INCIDENT]: renderIncidentOption,
  [EVENT_LINK_TARGET_TYPES.PATROL]: renderPatrolOption,
};

const LinkEventModal = ({
  canCreateIncident = false,
  event,
  isLinking = false,
  onAdd,
  onCreateIncident,
  onExited = null,
  onHide,
  show,
  type,
}) => {
  const { t } = useTranslation('reports', { keyPrefix: `linkEventModal.${type}` });
  const { t: tModal } = useTranslation('reports', { keyPrefix: 'linkEventModal' });

  const { displayTitle } = useReport(event);

  const resultsRef = useRef(null);

  const emptyStateId = useId();
  const titleId = useId();

  const [addingTargetId, setAddingTargetId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchedText, setSearchedText] = useState('');

  const linkTargets = useLinkTargets(type, searchedText);

  const canShowLinkTargets = !linkTargets.error && !linkTargets.isLoading;

  const updateSearchedTextDebounced = useMemo(() => debounce(setSearchedText, SEARCH_DEBOUNCE_DELAY), []);

  // The buttons stay focusable while a link runs, so their presses are ignored
  // here: disabling the focused one would drop the keyboard focus.
  const onAddTarget = (target) => {
    if (!isLinking) {
      setAddingTargetId(target.id);

      onAdd(target);
    }
  };

  const onClickCreateIncident = () => {
    if (!isLinking) {
      setAddingTargetId(null);

      onCreateIncident();
    }
  };

  const onChangeSearch = (changeEvent) => {
    setSearchText(changeEvent.target.value);
    updateSearchedTextDebounced(changeEvent.target.value);
  };

  const onClearSearch = () => {
    setSearchText('');
    updateSearchedTextDebounced.cancel();
    setSearchedText('');
  };

  return <Modal
    aria-labelledby={titleId}
    centered
    onExited={onExited}
    onHide={onHide}
    onKeyDown={keepFocusInside}
    show={show}
  >
    <Modal.Header className={styles.header}>
      <div className={styles.titleStack}>
        <Modal.Title className={styles.title} id={titleId}>{t('title')}</Modal.Title>

        <p className={styles.eventContext}>
          {!!event.serial_number && <span className={styles.serialNumber}>{event.serial_number}</span>}

          {displayTitle}
        </p>
      </div>

      <button
        aria-label={tModal('closeButtonLabel')}
        className={styles.closeButton}
        onClick={onHide}
        title={tModal('closeButtonLabel')}
        type="button"
      >
        <CrossIcon aria-hidden="true" />
      </button>
    </Modal.Header>

    <Modal.Body className={styles.body}>
      <SearchBar
        aria-describedby={emptyStateId}
        aria-label={t('searchBarLabel')}
        autoFocus
        className={styles.searchBar}
        onChange={onChangeSearch}
        onClear={onClearSearch}
        placeholder={t('searchBarLabel')}
        value={searchText}
      />

      <p className="sr-only" role="status">
        {canShowLinkTargets && t('resultsCountMessage', { count: linkTargets.linkTargets.length })}
      </p>

      {!!linkTargets.error && <div className={styles.errorState}>
        <ErrorMessage message={t('fetchErrorMessage')} />

        <button className={styles.retryButton} onClick={() => linkTargets.fetchLinkTargets()} type="button">
          {tModal('retryButtonLabel')}
        </button>
      </div>}

      {!linkTargets.error && linkTargets.isLoading && <DetailViewLoader
        className={styles.loader}
        label={t('loadingLabel')}
      />}

      {canShowLinkTargets && <div className={styles.results} ref={resultsRef}>
        {!linkTargets.linkTargets.length && <div className={styles.emptyState} id={emptyStateId}>
          {searchedText ? tModal('noMatchesMessageTitle') : t('emptyStateMessage')}

          {!!searchedText && <span className={styles.emptyStateMessage}>{tModal('noMatchesMessage')}</span>}
        </div>}

        {!!linkTargets.linkTargets.length && <InfiniteScroll
          aria-label={t('resultsListLabel')}
          className={styles.resultList}
          element="ul"
          getScrollParent={() => resultsRef.current}
          hasMore={linkTargets.hasNextPage}
          loadMore={linkTargets.fetchNextPage}
          useWindow={false}
        >
          {linkTargets.linkTargets.map((linkTarget) => RENDER_OPTION_BY_TYPE[type](linkTarget, {
            isAdding: isLinking && linkTarget.id === addingTargetId,
            isDisabled: isLinking,
            onAdd: onAddTarget,
          }))}

          {linkTargets.hasNextPage && <li className={styles.loadingMoreItem} key="loading-more">
            <MoonLoader aria-hidden color="var(--er-ui-cta-primary)" size={LOADER_SIZE} />

            <span className="sr-only">{t('loadingMoreLabel')}</span>
          </li>}
        </InfiniteScroll>}
      </div>}
    </Modal.Body>

    <Modal.Footer className={styles.footer}>
      {type === EVENT_LINK_TARGET_TYPES.INCIDENT && canCreateIncident && <button
        aria-busy={isLinking && !addingTargetId}
        aria-disabled={isLinking}
        className={styles.createIncidentButton}
        onClick={onClickCreateIncident}
        type="button"
      >
        {tModal('createIncidentButtonLabel')}
      </button>}

      <button className={styles.cancelButton} onClick={onHide} type="button">{tModal('cancelButtonLabel')}</button>
    </Modal.Footer>
  </Modal>;
};

export default LinkEventModal;
