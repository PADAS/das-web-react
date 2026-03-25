import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';

import { BREAKPOINTS } from '../constants';
import { updateEventFilter, INITIAL_FILTER_STATE } from '../ducks/event-filter';
import { DEFAULT_EVENT_SORT } from '../constants';
import { isFilterModified } from '../utils/event-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { trackEventFactory, EVENT_FILTER_CATEGORY, REPORTS_CATEGORY } from '../utils/analytics';
import { caseInsensitiveCompare } from '../utils/string';
import { useMatchMedia } from '../hooks';

import { getGlobalSchemaReportedBy } from '../selectors';

import SearchBar from '../SearchBar';
import FriendlyFilterString from '../FriendlyFilterString';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';
import * as styles from './styles.module.scss';
import DateFilter from './DateFilter';
import Filters from './Filters';
import { useTranslation } from 'react-i18next';

export const UPDATE_FILTER_DEBOUNCE_TIME = 200;
const eventFilterTracker = trackEventFactory(EVENT_FILTER_CATEGORY);
const reportsTracker = trackEventFactory(REPORTS_CATEGORY);

const EventFilter = ({
  children,
  className,
  eventFilter,
  eventTypes,
  feedEvents,
  reporters,
  resetGlobalDateRange,
  updateEventFilter,
  sortConfig = DEFAULT_EVENT_SORT,
  onResetAll = noop
}) => {
  const { state, filter: { date_range, event_type: currentFilterReportTypes, priority, reported_by, text } } = eventFilter;
  const eventTypeFilterEmpty = !currentFilterReportTypes.length;
  const [reportTypeFilterText, setReportTypeFilterText] = useState('');
  const [filterText, setFilterText] = useState(eventFilter.filter.text);
  const isLargeLayout = useMatchMedia(BREAKPOINTS.screenIsLargeLayoutOrLarger);
  const { t } = useTranslation('filters', { keyPrefix: 'eventsFilter' });

  const isSortModified = !isEqual(DEFAULT_EVENT_SORT, sortConfig);
  const isDateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, date_range);
  const stateFilterModified = !isEqual(INITIAL_FILTER_STATE.state, state);
  const priorityFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.priority, priority);
  const reportedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by);
  const filterModified = priorityFilterModified || !eventTypeFilterEmpty || stateFilterModified || reportedByFilterModified;

  const updateEventFilterDebounced = useRef(debounce(function (update) {
    updateEventFilter(update);
  }, UPDATE_FILTER_DEBOUNCE_TIME));

  const resetPopoverFilters = useCallback(() => {
    updateEventFilter({
      state: INITIAL_FILTER_STATE.state,
      filter: {
        event_type: INITIAL_FILTER_STATE.filter.event_type,
        priority: INITIAL_FILTER_STATE.filter.priority,
        reported_by: INITIAL_FILTER_STATE.filter.reported_by,
      },
    });
    setReportTypeFilterText('');
    eventFilterTracker.track('Click Reset All Filters');
  }, [updateEventFilter]);

  const clearDateRange = useCallback((e) => {
    if (e) e.stopPropagation();
    resetGlobalDateRange();
    eventFilterTracker.track('Click Reset Date Range Filter');
  }, [resetGlobalDateRange]);

  const onSearchClear = useCallback((e) => {
    e?.stopPropagation();
    setFilterText('');
    eventFilterTracker.track('Clear Search Text Filter');
  }, []);

  const resetAllFilters = useCallback(() => {
    if (filterModified) resetPopoverFilters();
    if (isDateRangeModified) clearDateRange();
    if (filterText) onSearchClear();
    onResetAll();
  }, [clearDateRange, isDateRangeModified, filterModified, filterText, onResetAll, onSearchClear, resetPopoverFilters]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);
    eventFilterTracker.debouncedTrack('Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, text)) {
      if (!!filterText.length) {
        updateEventFilterDebounced.current({
          filter: { text: filterText },
        });
      } else {
        updateEventFilter({
          filter: { text: '', },
        });
      }
    }
  }, [filterText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, text)) {
      setFilterText(text);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const DateFilterPopover = useCallback((props) =>
    <Popover placement='bottom'
             className={styles.filterPopover}
             id='filter-date-popover'
             data-testid='filter-date-popover'
             {...props}>
      <DateFilter isDateRangeModified={isDateRangeModified} onClearDateRange={clearDateRange} />
    </Popover>,
  [clearDateRange, isDateRangeModified]);

  const FiltersPopover = useCallback((props) => (
    <Popover id='filter-popover' data-testid='filter-popover' className={`${styles.filterPopover} ${styles.filters}`} {...props}>
      <Filters priority={priority}
               currentFilterReportTypes={currentFilterReportTypes}
               reportTypeFilterText={reportTypeFilterText}
               isFilterModified={filterModified}
               isEventTypeFilterEmpty={eventTypeFilterEmpty}
               isReportedByFilterModified={reportedByFilterModified}
               isPriorityFilterModified={priorityFilterModified}
               isStateFilterModified={stateFilterModified}
               reporters={reporters}
               reportedByFilter={reported_by}
               eventFilterTracker={eventFilterTracker}
               updateEventFilter={updateEventFilter}
               eventTypes={eventTypes}
               state={state}
               setReportTypeFilterText={setReportTypeFilterText}
               eventFilter={eventFilter}
               onResetPopoverFilters={resetPopoverFilters} />
    </Popover>
  ), [
    currentFilterReportTypes,
    eventFilter,
    eventTypeFilterEmpty,
    eventTypes,
    filterModified,
    priority,
    priorityFilterModified,
    reportTypeFilterText,
    reportedByFilterModified,
    reported_by,
    reporters,
    resetPopoverFilters,
    state,
    stateFilterModified,
    updateEventFilter
  ]);

  return <>
    <form
      className={`${styles.form} ${className} ${styles.oldNavigation}`}
      data-testid="eventFilter-form"
      onSubmit={e => e.preventDefault()}
      >
      <SearchBar
        className={styles.searchBar}
        placeholder={t('searchBarPlaceholder')}
        value={filterText}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />

      <div className={styles.buttons}>
        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='bottom' overlay={FiltersPopover} flip={true}>
          <button
            className={`${styles.button} ${filterModified ? styles.active : styles.inactive}`}
            data-testid='filter-btn'
            onClick={() => reportsTracker.track('Filters Icon Clicked')}
          >
            {t('filtersButton')}
          </button>
        </OverlayTrigger>

        <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='auto' overlay={DateFilterPopover} flip={true}>
          <button
            className={`${styles.button} ${isDateRangeModified ? styles.active : styles.inactive}`}
            data-testid='date-filter-btn'
            onClick={() => reportsTracker.track('Dates Icon Clicked')}
          >
            {t('datesButton')}
          </button>
        </OverlayTrigger>

        {children}
      </div>
    </form>

    {isLargeLayout && <div className={`${styles.filterStringWrapper} ${className}`} data-testid='general-reset-wrapper'>
      <FriendlyFilterString
        className={styles.friendlyFilterString}
        dateRange={date_range}
        isFiltered={isFilterModified(eventFilter)}
        sortConfig={sortConfig}
        totalFeedCount={feedEvents.count}
      />
      {
        (filterModified || isDateRangeModified || isSortModified || !!filterText) &&
        <Button type="button" variant='light' size='sm' onClick={resetAllFilters} data-testid='general-reset-btn'>
          <RefreshIcon title={t('resetButton')} />
          {t('resetButton')}
        </Button>
      }
    </div>}
  </>;
};

const mapStateToProps = (state) =>
  ({
    eventFilter: state.data.eventFilter,
    eventTypes: state.data.eventTypes,
    feedEvents: state.data.feedEvents,
    reporters: getGlobalSchemaReportedBy(state),
  });

export default connect(mapStateToProps, { updateEventFilter, resetGlobalDateRange })(memo(EventFilter));
