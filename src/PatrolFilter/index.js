import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';

import { caseInsensitiveCompare } from '../utils/string';
import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { getPatrolList } from '../selectors/patrols';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { isFilterModified } from '../utils/patrol-filter';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import DateRangePopover from './DateRangePopover';
import FiltersPopover from './FiltersPopover';
import FriendlyFilterString from '../FriendlyFilterString';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as FilterIcon } from '../common/images/icons/filter-icon.svg';
import SearchBar from '../SearchBar';

import patrolFilterStyles from './styles.module.scss';
import styles from '../EventFilter/styles.module.scss';

const { UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

export const PATROL_TEXT_FILTER_DEBOUNCE_TIME = 200;

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilter = ({ className, patrolFilter, patrols, updatePatrolFilter }) => {
  const containerRef = useRef(null);

  const [filterText, setFilterText] = useState(patrolFilter.filter.text);

  const updatePatrolFilterDebounced = useRef(debounce((update) => {
    updatePatrolFilter(update);
  }, PATROL_TEXT_FILTER_DEBOUNCE_TIME));

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterText(value);

    patrolFilterTracker.track('Change Search Text Filter');
  }, []);

  const resetSearch = useCallback((e) => {
    e.stopPropagation();
    setFilterText('');

    patrolFilterTracker.track('Clear Search Text Filter');
  }, []);

  useEffect(() => {
    if (!caseInsensitiveCompare(filterText, patrolFilter.filter.text)) {
      if (!!filterText.length) {
        updatePatrolFilterDebounced.current({ filter: { text: filterText } });
      } else {
        updatePatrolFilter({ filter: { text: '' } });
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
      className={`${UFA_NAVIGATION_UI ? patrolFilterStyles.form : patrolFilterStyles.oldNavigationForm} ${className}`}
      onSubmit={e => e.preventDefault()}
      >
      <SearchBar
        className={`${styles.search} ${UFA_NAVIGATION_UI ? patrolFilterStyles.search : patrolFilterStyles.oldNavigationSearch}`}
        placeholder='Search Patrols...'
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
          className={`${UFA_NAVIGATION_UI ? patrolFilterStyles.popoverTrigger : patrolFilterStyles.oldNavigationPopoverTrigger} ${patrolFilterStyles.filterButton}`}
          onClick={() => patrolFilterTracker.track('Filters Icon Clicked')}
          data-testid="patrolFilter-filtersButton"
        >
          <FilterIcon className={styles.filterIcon} />
          <span>Filters</span>
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
          <ClockIcon className={styles.clockIcon} />
          <span>Dates</span>
        </Button>
      </OverlayTrigger>
    </div>

    {UFA_NAVIGATION_UI && <div className={`${styles.filterStringWrapper} ${className}`}>
      <FriendlyFilterString
        className={styles.friendlyFilterString}
        dateRange={patrolFilter.filter.date_range}
        isFiltered={isFilterModified(patrolFilter)}
        totalFeedCount={patrols?.results?.length ?? 0}
      />
    </div>}
  </>;
};

PatrolFilter.defaultProps = { className: '' };

PatrolFilter.propTypes = {
  className: PropTypes.string,
  patrolFilter: PropTypes.shape({
    status: PropTypes.arrayOf(PropTypes.string),
    filters: PropTypes.shape({
      date_range: PropTypes.object,
      patrol_type: PropTypes.arrayOf(PropTypes.string),
      tracked_by: PropTypes.arrayOf(PropTypes.string),
      text: PropTypes.string,
    }),
  }).isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrols: getPatrolList(state),
});

export default connect(mapStateToProps, { updatePatrolFilter })(memo(PatrolFilter));
