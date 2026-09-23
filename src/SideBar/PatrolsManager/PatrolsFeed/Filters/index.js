import React, { memo, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import Overlay from 'react-bootstrap/Overlay';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { calcFriendlyDurationString } from '../../../../utils/datetime';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../ducks/patrol-filter';
import { isFilterModified } from '../../../../utils/patrol-filter';
import { resetGlobalDateRange } from '../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import SearchBar from '../../../../SearchBar';

import * as styles from './styles.module.scss';

export const TEXT_FILTER_DEBOUNCE_DELAY = 200;

// The menus inside the popovers are positioned fixed, which a transformed
// popover would anchor to itself rather than to the viewport.
const POPOVER_POPPER_CONFIG = { modifiers: [{ name: 'computeStyles', options: { gpuAcceleration: false } }] };

const POPOVER_KEYS = { DATES: 'dates', FILTERS: 'filters' };

// A popover still fading out can report a click outside it, which must not
// close the popover that replaced it.
const hidePopoverIfOpen = (popoverKey) => (openPopover) => openPopover === popoverKey ? null : openPopover;

const Filters = ({ resultCount }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters' });

  const tracker = useContext(TrackerContext);

  const patrolFilter = useSelector((state) => state.data.patrolFilter);

  const datesPopoverId = useId();
  const filtersPopoverId = useId();

  const [datesAnchor, setDatesAnchor] = useState(null);
  const [filterText, setFilterText] = useState(patrolFilter.filter.text);
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const [openPopover, setOpenPopover] = useState(null);

  const isDatesModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range)
    || INITIAL_FILTER_STATE.filter.patrols_overlap_daterange !== patrolFilter.filter.patrols_overlap_daterange;
  const isFiltersModified = !isEqual(INITIAL_FILTER_STATE.status, patrolFilter.status)
    || !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrolFilter.filter.patrol_type)
    || !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, patrolFilter.filter.tracked_by);

  const canReset = isDatesModified || isFiltersModified || !!filterText;

  // Reading the clock, so it is held until the range it describes moves rather
  // than rebuilt on every keystroke in the search box.
  const friendlyDateRange = useMemo(
    () => calcFriendlyDurationString(patrolFilter.filter.date_range.lower, patrolFilter.filter.date_range.upper),
    [patrolFilter.filter.date_range.lower, patrolFilter.filter.date_range.upper]
  );

  const updateTextFilterDebounced = useMemo(
    () => debounce(
      (text) => dispatch(updatePatrolFilter({ filter: { text } })),
      TEXT_FILTER_DEBOUNCE_DELAY
    ),
    [dispatch]
  );

  const hideDatesPopover = useCallback(() => setOpenPopover(hidePopoverIfOpen(POPOVER_KEYS.DATES)), []);
  const hideFiltersPopover = useCallback(() => setOpenPopover(hidePopoverIfOpen(POPOVER_KEYS.FILTERS)), []);

  const onChangeSearch = (event) => {
    setFilterText(event.target.value);

    updateTextFilterDebounced(event.target.value);

    tracker.track('Change the search text filter');
  };

  const onClearSearch = () => {
    setFilterText('');

    updateTextFilterDebounced.cancel();
    dispatch(updatePatrolFilter({ filter: { text: '' } }));

    tracker.track('Clear the search text filter');
  };

  const onReset = () => {
    setFilterText('');

    updateTextFilterDebounced.cancel();
    dispatch(updatePatrolFilter({
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
        text: INITIAL_FILTER_STATE.filter.text,
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
      },
      status: INITIAL_FILTER_STATE.status,
    }));
    dispatch(resetGlobalDateRange());

    tracker.track('Click reset all filters');
  };

  const onTogglePopover = (popoverKey) => () => {
    setOpenPopover((currentPopover) => currentPopover === popoverKey ? null : popoverKey);

    tracker.track(`Toggle the ${popoverKey} filter popover`);
  };

  useEffect(() => () => updateTextFilterDebounced.cancel(), [updateTextFilterDebounced]);

  return <div className={styles.filters}>
    <div className={styles.controls}>
      <SearchBar
        aria-label={t('searchbarPlaceHolder')}
        className={styles.searchBar}
        onChange={onChangeSearch}
        onClear={onClearSearch}
        placeholder={t('searchbarPlaceHolder')}
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
      </div>
    </div>

    <div className={styles.summaryBar}>
      <p className={styles.summary}>
        <Trans
          components={{ dateRange: <strong /> }}
          count={resultCount}
          i18nKey={isFilterModified(patrolFilter) ? 'filteredResultsSummary' : 'resultsSummary'}
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

export default memo(Filters);
