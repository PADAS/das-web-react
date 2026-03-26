import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';

import { caseInsensitiveCompare } from '../utils/string';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { selectPatrolsFeedMappedFromStore, selectPatrolsFeedTotalCount } from '../selectors/patrols';
import { isFilterModified } from '../utils/patrol-filter';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import FriendlyFilterString from '../FriendlyFilterString';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';

import SearchBar from '../SearchBar';

import * as styles from '../EventFilter/styles.module.scss';

export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilter = ({ className = '' }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters' });
  const dispatch = useDispatch();
  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);
  const patrolsFeedTotalCount = useSelector(selectPatrolsFeedTotalCount);
  const patrolFilter = useSelector(state => state.data.patrolFilter);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const updatePatrolFilterDebounced = useRef(debounce((update) => {
    dispatch(
      updatePatrolFilter(update)
    );
  }, PATROL_TEXT_FILTER_DEBOUNCE_TIME));

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const resetSearch = useCallback((event) => {
    event?.stopPropagation();
    setFilterText('');

    patrolFilterTracker.track('Clear Search Text Filter');
  }, []);

  const resetAllFilters = useCallback((event) => {
    event.stopPropagation();

    dispatch(updatePatrolFilter({
      filter: {
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
      },
      status: INITIAL_FILTER_STATE.status,
    }));
    patrolFilterTracker.track('Click Reset All Filters');

    dispatch(resetGlobalDateRange());
    patrolFilterTracker.track('Click Reset Date Range Filter');

    resetSearch(null);
  }, [dispatch, resetSearch]);

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, patrolFilter.filter.text)) {
      if (!!filterText.length) {
        updatePatrolFilterDebounced.current({ filter: { text: filterText } });
      } else {
        dispatch(
          updatePatrolFilter({ filter: { text: '' } })
        );
      }
    }
  }, [filterText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, patrolFilter.filter.text)) {
      setFilterText(patrolFilter.filter.text);
    }
  }, [patrolFilter.filter.text]); // eslint-disable-line react-hooks/exhaustive-deps

  const leadersFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, patrolFilter.filter.tracked_by);
  const patrolTypesFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, patrolFilter.filter.patrol_type);
  const statusModified = !isEqual(INITIAL_FILTER_STATE.status, patrolFilter.status);
  const filtersModified = leadersFilterModified || patrolTypesFilterModified || statusModified;
  const dateRangeModified = !isEqual(INITIAL_FILTER_STATE.filter.date_range, patrolFilter.filter.date_range);

  return <>
    <form
      className={`${styles.form} ${className}`}
      onSubmit={e => e.preventDefault()}
      >
      <SearchBar
        className={styles.searchBar}
        placeholder={t('searchbarPlaceHolder')}
        value={filterText}
        onChange={onSearchChange}
        onClear={resetSearch}
      />

      <div className={styles.buttons}>
        <OverlayTrigger
          shouldUpdatePosition={true}
          rootClose
          trigger='click'
          placement='bottom'
          overlay={<FiltersPopover />}
          flip={true}
        >
          <button
            className={`${styles.button} ${filtersModified ? styles.active : styles.inactive}`}
            data-testid="patrolFilter-filtersButton"
            onClick={() => patrolFilterTracker.track('Filters Icon Clicked')}
          >
            {t('filtersTitle')}
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          shouldUpdatePosition={true}
          rootClose
          trigger='click'
          placement='auto'
          overlay={<DateRangePopover />}
          flip={true}
        >
          <button
            className={`${styles.button} ${dateRangeModified ? styles.active : styles.inactive}`}
            onClick={() => patrolFilterTracker.track('Date Filter Popover Toggled')}
            data-testid="patrolFilter-dateRangeButton"
          >
            {t('datesTitle')}
          </button>
        </OverlayTrigger>
      </div>
    </form>

    <div className={`${styles.filterStringWrapper} ${className}`}>
      <FriendlyFilterString
        className={styles.friendlyFilterString}
        dateRange={patrolFilter.filter.date_range}
        isFiltered={isFilterModified(patrolFilter)}
        totalFeedCount={patrolsFeedTotalCount}
      />

      {
          (filtersModified || dateRangeModified || !!filterText) &&
          <Button type="button" variant='light' size='sm' onClick={resetAllFilters}>
            <RefreshIcon title={t('globalResetFilterButton')} />
            {t('globalResetFilterButton')}
          </Button>
      }
    </div>
  </>;
};

export default PatrolFilter;
