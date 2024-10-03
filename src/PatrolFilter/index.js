import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { caseInsensitiveCompare } from '../utils/string';
import { getPatrolList } from '../selectors/patrols';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { isFilterModified } from '../utils/patrol-filter';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import FriendlyFilterString from '../FriendlyFilterString';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import { ReactComponent as RefreshIcon } from '../common/images/icons/refresh-icon.svg';

import SearchBar from '../SearchBar';

import patrolFilterStyles from './styles.module.scss';
import styles from '../EventFilter/styles.module.scss';
import { resetGlobalDateRange } from '../ducks/global-date-range';

export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilter = ({ className }) => {
  const containerRef = useRef(null);
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters' });
  const dispatch = useDispatch();
  const patrols = useSelector(getPatrolList);
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

  const resetSearch = useCallback((event = null) => {
    event?.stopPropagation();
    setFilterText('');

    patrolFilterTracker.track('Clear Search Text Filter');
  }, []);

  const resetDateRange = useCallback(() => {
    dispatch(resetGlobalDateRange());

    patrolFilterTracker.track('Click Reset Date Range Filter');
  }, [dispatch]);

  const resetFiltersPopover = useCallback(() => {
    dispatch(updatePatrolFilter({
      filter: {
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
      },
      status: INITIAL_FILTER_STATE.status,
    }));

    patrolFilterTracker.track('Click Reset All Filters');
  }, [dispatch]);

  const resetAllFilters = useCallback((event) => {
    event.stopPropagation();
    resetFiltersPopover();
    resetDateRange();
    resetSearch();
  }, [resetDateRange, resetFiltersPopover, resetSearch]);

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
    <div
      ref={containerRef}
      className={`${patrolFilterStyles.form} ${className}`}
      onSubmit={e => e.preventDefault()}
      >
      <SearchBar
        className={`${styles.search} ${patrolFilterStyles.search}`}
        placeholder={t('searchbarPlaceHolder')}
        value={filterText}
        onChange={onSearchChange}
        onClear={resetSearch}
      />

      <OverlayTrigger
        shouldUpdatePosition={true}
        rootClose
        trigger='click'
        placement='auto'
        overlay={<FiltersPopover />}
        flip={true}
      >
        <Button
          variant={filtersModified ? 'primary' : 'light'}
          size='sm'
          className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.filterButton}`}
          onClick={() => patrolFilterTracker.track('Filters Icon Clicked')}
          data-testid="patrolFilter-filtersButton"
        >
          <FilterIcon className={styles.filterIcon} title={t('filtersTitle')} />
          <span>{t('filtersTitle')}</span>
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        shouldUpdatePosition={true}
        rootClose
        trigger='click'
        placement='auto'
        overlay={<DateRangePopover containerRef={containerRef} />}
        flip={true}
      >
        <Button
          variant={dateRangeModified ? 'primary' : 'light'}
          size='sm'
          className={`${patrolFilterStyles.popoverTrigger} ${patrolFilterStyles.dateFilterButton}`}
          onClick={() => patrolFilterTracker.track('Date Filter Popover Toggled')}
          data-testid="patrolFilter-dateRangeButton"
        >
          <ClockIcon className={styles.clockIcon} title={t('datesTitle')} />
          <span>{t('datesTitle')}</span>
        </Button>
      </OverlayTrigger>
    </div>

    <div className={`${styles.filterStringWrapper} ${className}`}>
      <FriendlyFilterString
        className={styles.friendlyFilterString}
        dateRange={patrolFilter.filter.date_range}
        isFiltered={isFilterModified(patrolFilter)}
        totalFeedCount={patrols?.results?.length ?? 0}
      />

      {
          (filtersModified || dateRangeModified || !!filterText) &&
          <Button type="button" variant='light' size='sm' onClick={resetAllFilters}>
            <RefreshIcon title={t('resetButton')} />
            {t('resetButton')}
          </Button>
      }
    </div>
  </>;
};

PatrolFilter.defaultProps = {
  className: '',
};

PatrolFilter.propTypes = {
  className: PropTypes.string,
};

export default PatrolFilter;
