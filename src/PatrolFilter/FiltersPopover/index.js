import React, { memo, useCallback, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import uniq from 'lodash/uniq';
import { useTranslation } from 'react-i18next';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import { iconTypeForPatrol } from '../../utils/patrols';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../../utils/analytics';

import CheckboxList from '../../CheckboxList';
import DasIcon from '../../DasIcon';
import ReportedBySelect from '../../ReportedBySelect';

import colorVariables from '../../common/styles/vars/colors.module.scss';
import patrolFiltersPopoverStyles from './styles.module.scss';
import styles from '../../EventFilter/styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const CHECKBOX_LIST_ALL_OPTION_ID = 'all';
const PATROL_FILTERS_LEADERS_KEY = 'tracked_by';
const PATROL_FILTERS_PATROL_TYPE_KEY = 'patrol_type';
const PATROL_FILTERS_STATUS_OPTIONS = [
  { color: colorVariables.patrolActiveThemeColor, id: 'active' },
  // { color: colorVariables.patrolReadyThemeColor, id: 'scheduled', value: 'Scheduled' },
  // { color: colorVariables.patrolOverdueThemeColor, id: 'overdue', value: 'Overdue' },
  { color: colorVariables.patrolDoneThemeColor, id: 'done' },
  { color: colorVariables.patrolCancelledThemeColor, id: 'cancelled' },
];

const calculateNewCheckedItems = (clickedItemId, checkedItemIds) => {
  if (clickedItemId === CHECKBOX_LIST_ALL_OPTION_ID) {
    return [];
  }
  if (checkedItemIds.includes(clickedItemId)) {
    return checkedItemIds.filter(checkedItemId => checkedItemId !== clickedItemId);
  }
  return [...checkedItemIds, clickedItemId];
};

const FiltersPopover = React.forwardRef(({
  fetchTrackedBySchema,
  patrolFilter,
  patrolLeaderSchema,
  patrolTypes,
  updatePatrolFilter,
  ...rest
}, ref) => {
  const { status: selectedStatusIds } = patrolFilter;
  const {
    tracked_by: selectedLeaderIds,
    patrol_type: selectedPatrolTypeIds,
  } = patrolFilter.filter;
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters.filtersPopover' });

  const onLeadersFilterChange = useCallback((leadersSelected) => {
    const isAnyLeaderSelected = !!leadersSelected?.length;
    updatePatrolFilter({
      filter: { tracked_by: isAnyLeaderSelected ? uniq(leadersSelected.map(({ id }) => id)) : [] }
    });

    patrolFilterTracker.track(
      `${isAnyLeaderSelected ? 'Set' : 'Clear'} 'Tracked By' Filter`,
      isAnyLeaderSelected ? `${leadersSelected.length} trackers` : null
    );
  }, [updatePatrolFilter]);

  const onStatusFilterChange = useCallback((clickedStatus) => {
    const checkedStatus = calculateNewCheckedItems(clickedStatus.id, selectedStatusIds);
    updatePatrolFilter({ status: checkedStatus });

    const isAnyStatusChecked = checkedStatus[0] !== CHECKBOX_LIST_ALL_OPTION_ID;
    patrolFilterTracker.track(
      `${isAnyStatusChecked ? 'Set' : 'Clear'} 'Status' Filter`,
      isAnyStatusChecked ? `${selectedStatusIds.length} status` : null
    );
  }, [selectedStatusIds, updatePatrolFilter]);

  const onPatrolTypesFilterChange = useCallback((clickedPatrolType) => {
    const checkedPatrolTypes = calculateNewCheckedItems(clickedPatrolType.id, selectedPatrolTypeIds);
    updatePatrolFilter({ filter: { patrol_type: checkedPatrolTypes } });

    const isAnyPatrolTypeSelected = !!selectedPatrolTypeIds.length;
    patrolFilterTracker.track(
      `${isAnyPatrolTypeSelected ? 'Set' : 'Clear'} 'Patrol Types' Filter`,
      isAnyPatrolTypeSelected ? `${selectedPatrolTypeIds.length} types` : null
    );
  }, [selectedPatrolTypeIds, updatePatrolFilter]);

  const resetFilters = useCallback(() => {
    updatePatrolFilter({
      filter: {
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
      },
      status: INITIAL_FILTER_STATE.status,
    });

    patrolFilterTracker.track('Click Reset All Filters');
  }, [updatePatrolFilter]);

  const resetFilter = useCallback((filterToReset) => (e) => {
    e.stopPropagation();
    updatePatrolFilter({ filter: { [filterToReset]: INITIAL_FILTER_STATE.filter[filterToReset] } });

    patrolFilterTracker.track(`Click reset ${filterToReset} filter`);
  }, [updatePatrolFilter]);

  const resetStatusFilter = useCallback((e) => {
    e.stopPropagation();
    updatePatrolFilter({ status: INITIAL_FILTER_STATE.status });

    patrolFilterTracker.track('Click reset status');
  }, [updatePatrolFilter]);

  useEffect(() => {
    if (isEmpty(patrolLeaderSchema)){
      fetchTrackedBySchema();
    }
  }, [fetchTrackedBySchema, patrolLeaderSchema]);

  const patrolLeaderFilterOptions = patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(({ value }) => value)
    || [];

  const selectedLeaders = !!selectedLeaderIds?.length && !isEmpty(patrolLeaderSchema) ?
    selectedLeaderIds.map(id => patrolLeaderFilterOptions.find(leader => leader.id === id))
    : [];

  const statusFilterOptions = PATROL_FILTERS_STATUS_OPTIONS.map(status => ({
    id: status.id,
    value: <div className='statusItem'>
      {<DasIcon color={status.color} iconId='generic_rep' type='events' />}
      {(t(`patrolStatuses.${status.id}`))}
    </div>,
  }));
  statusFilterOptions.unshift({
    id: CHECKBOX_LIST_ALL_OPTION_ID,
    value: t('checkBoxAllOption'),
  });

  const patrolTypeFilterOptions = patrolTypes.map(patrolType => {
    const patrolIconId = iconTypeForPatrol(patrolType);

    return {
      id: patrolType.id,
      value: <div className='patrolTypeItem'>
        {patrolIconId && <DasIcon color='black' iconId={patrolIconId} type='events' />}
        {patrolType.display}
      </div>,
    };
  });
  patrolTypeFilterOptions.unshift({
    id: CHECKBOX_LIST_ALL_OPTION_ID,
    value: t('checkBoxAllOption'),
  });

  const leadersFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, selectedLeaderIds);
  const patrolTypesFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.patrol_type, selectedPatrolTypeIds);
  const statusFilterModified = !isEqual(INITIAL_FILTER_STATE.status, patrolFilter.status);
  const filtersModified = leadersFilterModified || patrolTypesFilterModified || statusFilterModified;

  const patrolTypesCheckboxListValues = !!selectedPatrolTypeIds.length
    ? selectedPatrolTypeIds : [CHECKBOX_LIST_ALL_OPTION_ID];
  const statusCheckboxListValues = !!selectedStatusIds.length ? selectedStatusIds : [CHECKBOX_LIST_ALL_OPTION_ID];

  return <Popover
      {...rest}
      ref={ref}
      className={`${styles.filterPopover} ${styles.filters} ${patrolFiltersPopoverStyles.popover}`}
      id='filter-popover'
    >
    <Popover.Header>
      <div className={styles.popoverTitle}>
        {t('title')}
        {!!filtersModified &&
          <Button
            className={patrolFiltersPopoverStyles.resetAllButton}
            onClick={resetFilters}
            size='sm'
            type="button"
            variant='light'
          >
            {t('resetAllButton')}
          </Button>
        }
      </div>
    </Popover.Header>

    <Popover.Body>
      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.leadersFilterContainer}`}>
        <label>
          {t('trackedByLabel')}
        </label>
        <div className="select">
          <ReportedBySelect
            className={styles.reportedBySelect}
            isMulti
            onChange={onLeadersFilterChange}
            options={patrolLeaderFilterOptions}
            placeholder={t('reportedByPlaceholder')}
            value={selectedLeaders}
          />
          <Button
            className={!leadersFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-leaders-button'
            onClick={resetFilter(PATROL_FILTERS_LEADERS_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            {t('resetButton')}
          </Button>
        </div>
      </div>

      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.statusContainer}`}>
        <div className='header'>
          <label>{t('statusLabel')}</label>
          <Button
            className={!statusFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-status-button'
            onClick={resetStatusFilter}
            size='sm'
            type="button"
            variant='light'
          >
            {t('resetButton')}
          </Button>
        </div>
        <div className='checkboxListContainer' data-testid='patrolFilter-status-checkbox-list'>
          <CheckboxList
            options={statusFilterOptions}
            onItemChange={onStatusFilterChange}
            values={statusCheckboxListValues}
          />
        </div>
      </div>

      <div className={`${styles.filterRow} ${patrolFiltersPopoverStyles.patrolTypeContainer}`}>
        <div className='header'>
          <label>{t('patrolTypeLabel')}</label>
          <Button
            className={!patrolTypesFilterModified && 'hidden'}
            data-testid='patrolFilter-reset-patrol-type-button'
            onClick={resetFilter(PATROL_FILTERS_PATROL_TYPE_KEY)}
            size='sm'
            type="button"
            variant='light'
          >
            {t('resetButton')}
          </Button>
        </div>
        <div className='checkboxListContainer' data-testid='patrolFilter-patrol-type-checkbox-list'>
          <CheckboxList
            options={patrolTypeFilterOptions}
            onItemChange={onPatrolTypesFilterChange}
            values={patrolTypesCheckboxListValues}
          />
        </div>
      </div>
    </Popover.Body>
  </Popover>;
});

FiltersPopover.propTypes = {
  fetchTrackedBySchema: PropTypes.func.isRequired,
  patrolFilter: PropTypes.shape({
    filters: PropTypes.shape({
      patrol_type: PropTypes.arrayOf(PropTypes.string),
      tracked_by: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  patrolLeaderSchema: PropTypes.shape({
    trackedbySchema: PropTypes.shape({
      properties: PropTypes.shape({
        leader: PropTypes.shape({
          enum_ext: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.object })),
        }),
      }),
    }),
  }).isRequired,
  patrolTypes: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string,
    id: PropTypes.string,
    icon_id: PropTypes.string,
  })).isRequired,
  updatePatrolFilter: PropTypes.func.isRequired,
};

FiltersPopover.displayName = 'FiltersPopover';

const mapStateToProps = (state) => ({
  patrolFilter: state.data.patrolFilter,
  patrolLeaderSchema: state.data.patrolLeaderSchema,
  patrolTypes: state.data.patrolTypes,
});

export default connect(
  mapStateToProps,
  { fetchTrackedBySchema, updatePatrolFilter },
  null,
  { forwardRef: true }
)(memo(FiltersPopover));
