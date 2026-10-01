import React, { memo, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import Overlay from 'react-bootstrap/Overlay';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { calcFriendlyDurationString } from '../utils/datetime';
import { DEFAULT_EVENT_SORT, POPOVER_POPPER_CONFIG } from '../constants';
import { INITIAL_FILTER_STATE, updateEventFilter } from '../ducks/event-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { TrackerContext } from '../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

export const TEXT_FILTER_DEBOUNCE_DELAY = 200;

const POPOVER_KEYS = { DATES: 'dates', FILTERS: 'filters' };

// A popover still fading out can report a click outside it, which must not
// close the popover that replaced it.
const hidePopoverIfOpen = (popoverKey) => (openPopover) => openPopover === popoverKey ? null : openPopover;

const EventFilter = ({ children, className = '', isSortable = false }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'eventFilters' });

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const feedEventsCount = useSelector((state) => state.data.feedEvents.count);

  const tracker = useContext(TrackerContext);

  const datesPopoverId = useId();
  const filtersPopoverId = useId();

  const [datesAnchor, setDatesAnchor] = useState(null);
  const [filterText, setFilterText] = useState(eventFilter.filter.text);
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const [openPopover, setOpenPopover] = useState(null);

  const isDatesModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, eventFilter.filter.date_range);
  const isFiltersModified = !isEqual(INITIAL_FILTER_STATE.state, eventFilter.state)
    || !isEqual(INITIAL_FILTER_STATE.filter.event_type, eventFilter.filter.event_type)
    || !isEqual(INITIAL_FILTER_STATE.filter.priority, eventFilter.filter.priority)
    || !isEqual(INITIAL_FILTER_STATE.filter.reported_by, eventFilter.filter.reported_by);
  const isSortModified = isSortable && !isEqual(DEFAULT_EVENT_SORT, eventFilter.filter.sort);

  const canReset = isDatesModified || isFiltersModified || isSortModified || !!filterText;

  // Reading the clock, so it is held until the range it describes moves rather
  // than rebuilt on every keystroke in the search box.
  const friendlyDateRange = useMemo(
    () => calcFriendlyDurationString(eventFilter.filter.date_range.lower, eventFilter.filter.date_range.upper),
    [eventFilter.filter.date_range.lower, eventFilter.filter.date_range.upper]
  );

  const updateTextFilterDebounced = useMemo(
    () => debounce(
      (text) => {
        dispatch(updateEventFilter({ filter: { text } }));

        tracker.track('Change the search text filter');
      },
      TEXT_FILTER_DEBOUNCE_DELAY
    ),
    [dispatch, tracker]
  );

  const hideDatesPopover = useCallback(() => setOpenPopover(hidePopoverIfOpen(POPOVER_KEYS.DATES)), []);
  const hideFiltersPopover = useCallback(() => setOpenPopover(hidePopoverIfOpen(POPOVER_KEYS.FILTERS)), []);

  const onChangeSearch = (event) => {
    setFilterText(event.target.value);

    updateTextFilterDebounced(event.target.value);
  };

  const onClearSearch = () => {
    setFilterText('');

    updateTextFilterDebounced.cancel();
    dispatch(updateEventFilter({ filter: { text: '' } }));

    tracker.track('Clear the search text filter');
  };

  const onReset = () => {
    setFilterText('');

    updateTextFilterDebounced.cancel();
    dispatch(updateEventFilter({
      filter: {
        event_type: INITIAL_FILTER_STATE.filter.event_type,
        priority: INITIAL_FILTER_STATE.filter.priority,
        reported_by: INITIAL_FILTER_STATE.filter.reported_by,
        sort: isSortable ? DEFAULT_EVENT_SORT : eventFilter.filter.sort,
        text: INITIAL_FILTER_STATE.filter.text,
      },
      state: INITIAL_FILTER_STATE.state,
    }));
    dispatch(resetGlobalDateRange());

    tracker.track('Click reset all filters');
  };

  const onTogglePopover = (popoverKey) => () => {
    setOpenPopover((currentPopover) => currentPopover === popoverKey ? null : popoverKey);

    tracker.track(`Toggle the ${popoverKey} filter popover`);
  };

  useEffect(() => () => updateTextFilterDebounced.flush(), [updateTextFilterDebounced]);

  return <div className={`${styles.eventFilter} ${className}`}>
    <div className={styles.controls}>
      <SearchBar
        aria-label={t('searchBarPlaceholder')}
        className={styles.searchBar}
        onChange={onChangeSearch}
        onClear={onClearSearch}
        placeholder={t('searchBarPlaceholder')}
        value={filterText}
      />

      <div className={styles.triggerButtons}>
        <button
          aria-controls={openPopover === POPOVER_KEYS.FILTERS ? filtersPopoverId : undefined}
          aria-expanded={openPopover === POPOVER_KEYS.FILTERS}
          aria-haspopup="dialog"
          aria-label={isFiltersModified ? t('filtersModifiedButtonLabel') : undefined}
          className={`${styles.triggerButton} ${isFiltersModified ? styles.active : ''}`}
          onClick={onTogglePopover(POPOVER_KEYS.FILTERS)}
          ref={setFiltersAnchor}
          type="button"
        >
          {t('filtersTitle')}
        </button>

        <button
          aria-controls={openPopover === POPOVER_KEYS.DATES ? datesPopoverId : undefined}
          aria-expanded={openPopover === POPOVER_KEYS.DATES}
          aria-haspopup="dialog"
          aria-label={isDatesModified ? t('datesModifiedButtonLabel') : undefined}
          className={`${styles.triggerButton} ${isDatesModified ? styles.active : ''}`}
          onClick={onTogglePopover(POPOVER_KEYS.DATES)}
          ref={setDatesAnchor}
          type="button"
        >
          {t('datesTitle')}
        </button>

        {children}
      </div>
    </div>

    <div className={styles.summaryBar}>
      <p className={styles.summary}>
        <Trans
          components={{ dateRange: <strong /> }}
          count={feedEventsCount ?? 0}
          i18nKey={isFiltersModified || !!eventFilter.filter.text ? 'filteredResultsSummary' : 'resultsSummary'}
          t={t}
          values={{ dateRange: friendlyDateRange }}
        />
      </p>

      {!!canReset && <button className={styles.resetButton} onClick={onReset} type="button">
        {t('globalResetFilterButton')}
      </button>}
    </div>

    <Overlay
      placement="bottom"
      popperConfig={POPOVER_POPPER_CONFIG}
      show={openPopover === POPOVER_KEYS.FILTERS}
      target={filtersAnchor}
    >
      <FiltersPopover id={filtersPopoverId} onClose={hideFiltersPopover} trigger={filtersAnchor} />
    </Overlay>

    <Overlay
      placement="bottom"
      popperConfig={POPOVER_POPPER_CONFIG}
      show={openPopover === POPOVER_KEYS.DATES}
      target={datesAnchor}
    >
      <DateRangePopover id={datesPopoverId} onClose={hideDatesPopover} trigger={datesAnchor} />
    </Overlay>
  </div>;
};

export default memo(EventFilter);
