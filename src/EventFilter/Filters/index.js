import React, { memo, useCallback, useMemo } from 'react';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import intersection from 'lodash-es/intersection';
import isEqual from 'react-fast-compare';
import uniq from 'lodash-es/uniq';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UserIcon } from '../../common/images/icons/user-profile.svg';
import ReportedBySelect from '../../ReportedBySelect';
import PriorityPicker from '../../PriorityPicker';
import CheckMark from '../../Checkmark';
import ReportTypeMultiSelect from '../../ReportTypeMultiSelect';
import { EVENT_STATE_CHOICES } from '../../constants';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';

import styles from '../styles.module.scss';

const StateSelector = ({ onStateSelect, state, t }) => (
  <ul className={styles.stateList} data-testid="state-filter-options">
    {EVENT_STATE_CHOICES.map(choice =>
      <li key={choice.value}>
        <Button variant='link'
                  className={isEqual(choice.value, state) ? styles.activeState : ''}
                  onClick={() => onStateSelect(choice)}>
          {t(`stateSelector.${choice.key}`)}
        </Button>
      </li>)}
  </ul>
);

const ResetButton = ({ text, ...otherProps }) => (
  <Button type="button" variant='light' size='sm' {...otherProps}>
    {text}
  </Button>
);

const Filters = ({
  priority,
  reportTypeFilterText,
  isFilterModified,
  isReportedByFilterModified,
  isEventTypeFilterEmpty,
  isPriorityFilterModified,
  isStateFilterModified,
  currentFilterReportTypes,
  reporters,
  reportedByFilter,
  eventFilterTracker,
  updateEventFilter,
  eventTypes,
  state,
  onResetPopoverFilters,
  setReportTypeFilterText
}) => {
  const eventTypeIDs = useMemo(() => eventTypes.map(type => type.id), [eventTypes]);
  const reportTypesCheckedCount = intersection(eventTypeIDs, currentFilterReportTypes).length;
  const someReportTypesChecked = !isEventTypeFilterEmpty && !!reportTypesCheckedCount;
  const noReportTypesChecked = !isEventTypeFilterEmpty && !someReportTypesChecked;
  const { t } = useTranslation('filters', { keyPrefix: 'filters' });

  const selectedReporters = useMemo(() =>
    reportedByFilter && !!reportedByFilter.length
      ? reportedByFilter.map(id => reporters.find(r => r.id === id)).filter(item => !!item)
      : [],
  [reporters, reportedByFilter]);

  const onToggleAllReportTypes = useCallback((e) => {
    e.stopPropagation();
    if (isEventTypeFilterEmpty) {
      eventFilterTracker.track('Uncheck All Event Types Filter');
      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      eventFilterTracker.track('Check All Event Types Filter');
      updateEventFilter({ filter: { event_type: [] } });
    }
  }, [eventFilterTracker, isEventTypeFilterEmpty, updateEventFilter]);

  const onResetReportTypes = useCallback((_e) => {
    eventFilterTracker.track('Reset Event Types Filter');
    setReportTypeFilterText('');
    updateEventFilter({ filter: { event_type: [] } });
  }, [eventFilterTracker, setReportTypeFilterText, updateEventFilter]);

  const onReportCategoryToggle = useCallback(({ value }) => {
    const toToggle = eventTypes.filter(({ category: { value: v } }) => v === value).map(({ id }) => id);
    const allShown = isEventTypeFilterEmpty ? true : (intersection(currentFilterReportTypes, toToggle).length === toToggle.length);

    if (allShown) {
      eventFilterTracker.track('Uncheck Event Type Category Filter');
      updateEventFilter({ filter: { event_type: (isEventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(id => !toToggle.includes(id)) } });
    } else {
      eventFilterTracker.track('Uncheck Event Type Category Filter');
      const updatedValue = uniq([...currentFilterReportTypes, ...toToggle]);
      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  }, [eventTypes, isEventTypeFilterEmpty, currentFilterReportTypes, eventFilterTracker, updateEventFilter, eventTypeIDs]);

  const onReportedByChange = useCallback((values) => {
    const hasValue = values && !!values.length;
    updateEventFilter({
      filter: {
        reported_by: hasValue ? uniq(values.map(({ id }) => id)) : [],
      }
    });
    eventFilterTracker.track(`${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`, hasValue ? `${values.length} reporters` : null);
  }, [eventFilterTracker, updateEventFilter]);

  const onPriorityChange = useCallback((value) => {
    const newVal = priority.includes(value)
      ? priority.filter(item => item !== value)
      : [...priority, value];
    updateEventFilter({
      filter: {
        priority: newVal,
      },
    });
    eventFilterTracker.track('Set Priority Filter', newVal.toString());
  }, [eventFilterTracker, priority, updateEventFilter]);

  const onReportTypeToggle = useCallback(({ id }) => {
    const visible = isEventTypeFilterEmpty ? true : currentFilterReportTypes.includes(id);
    if (visible) {
      eventFilterTracker.track('Uncheck Event Type Filter');
      updateEventFilter({ filter: { event_type: (isEventTypeFilterEmpty ? eventTypeIDs : currentFilterReportTypes).filter(item => item !== id) } });
    } else {
      eventFilterTracker.track('Check Event Type Filter');
      const updatedValue = [...currentFilterReportTypes, id];
      updateEventFilter({ filter: { event_type: updatedValue.length === eventTypeIDs.length ? [] : updatedValue } });
    }
  }, [isEventTypeFilterEmpty, currentFilterReportTypes, eventFilterTracker, updateEventFilter, eventTypeIDs]);

  const onFilteredReportsSelect = useCallback((types) => {
    updateEventFilter({ filter: { event_type: types.map(({ id }) => id) } });
  }, [updateEventFilter]);

  const onResetStateFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ state: INITIAL_FILTER_STATE.state });
    eventFilterTracker.track('Click Reset State Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onResetPriorityFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });
    eventFilterTracker.track('Click Reset Priority Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onResetReportedByFilter = useCallback((e) => {
    e.stopPropagation();
    updateEventFilter({ filter: { reported_by: INITIAL_FILTER_STATE.filter.reported_by } });
    eventFilterTracker.track('Click Reset Reported By Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onStateSelect = useCallback(({ value }) => {
    if (!isEqual(state, value)){
      updateEventFilter({ state: value });
      eventFilterTracker.track(`Select '${value}' State Filter`);
    }
  }, [eventFilterTracker, state, updateEventFilter]);

  const appliedFilterLabel = useMemo(() => {
    if (isEventTypeFilterEmpty){
      return t('reportTypesSelectionLabels.allSelected');
    }
    if (someReportTypesChecked) {
      return t('reportTypesSelectionLabels.someSelected', {
        reportTypesCheckedCount,
        eventTypeIDsLength: eventTypeIDs.length
      });
    }

    return t('reportTypesSelectionLabels.noneSelected');
  }, [eventTypeIDs.length, isEventTypeFilterEmpty, reportTypesCheckedCount, someReportTypesChecked, t]);

  return <>
    <Popover.Header>
      <div className={styles.popoverTitle}>
        {t('title')}
        <ResetButton onClick={onResetPopoverFilters} disabled={!isFilterModified} text={t('restAllButton')}/>
      </div>
    </Popover.Header>

    <Popover.Body>
      <div className={styles.filterRow}>
        <label>
          {t('stateLabel')}
        </label>
        <StateSelector onStateSelect={onStateSelect} state={state} t={t} />
        <ResetButton disabled={!isStateFilterModified} onClick={onResetStateFilter} text={t('restButton')} />
      </div>

      <div className={`${styles.filterRow} ${styles.priorityRow}`}>
        <label>
          {t('priorityPickerLabel')}
        </label>
        <PriorityPicker
            className={styles.priorityPicker}
            onSelect={onPriorityChange}
            selected={priority}
            isMulti={true} />
        <ResetButton disabled={!isPriorityFilterModified} onClick={onResetPriorityFilter} text={t('restButton')} />
      </div>

      <div className={styles.filterRow}>
        <UserIcon className={styles.userIcon}/>
        <ReportedBySelect className={styles.reportedBySelect} value={selectedReporters} onChange={onReportedByChange}
                          isMulti={true}/>
        <ResetButton disabled={!isReportedByFilterModified} onClick={onResetReportedByFilter} text={t('restButton')} />
      </div>

      <div className={`${styles.filterRow} ${styles.reportTypeRow}`}>
        <h5 className={`${styles.filterTitle} ${styles.reportFilterTitle}`}>
          <div className={styles.toggleAllReportTypes}>
            <CheckMark fullyChecked={!noReportTypesChecked && !someReportTypesChecked}
                       partiallyChecked={!noReportTypesChecked && someReportTypesChecked}
                       onClick={onToggleAllReportTypes}/>
            <span>{t('reportTypesAllLabel')}</span>
          </div>
          {t('reportTypesLabel')}
          <small className={!isEventTypeFilterEmpty ? styles.modified : ''}>
            {appliedFilterLabel}
          </small>
          <ResetButton disabled={isEventTypeFilterEmpty} onClick={onResetReportTypes} text={t('restButton')} />
        </h5>

        <ReportTypeMultiSelect filter={reportTypeFilterText}
                               onFilterChange={setReportTypeFilterText}
                               selectedReportTypeIDs={currentFilterReportTypes}
                               onCategoryToggle={onReportCategoryToggle}
                               onFilteredItemsSelect={onFilteredReportsSelect}
                               onTypeToggle={onReportTypeToggle}/>
      </div>
    </Popover.Body>
  </>;
};

Filters.propTypes = {
  priority: PropTypes.string.isRequired,
  reportTypeFilterText: PropTypes.string.isRequired,
  isFilterModified: PropTypes.bool.isRequired,
  isReportedByFilterModified: PropTypes.bool.isRequired,
  isEventTypeFilterEmpty: PropTypes.bool.isRequired,
  isPriorityFilterModified: PropTypes.bool.isRequired,
  isStateFilterModified: PropTypes.bool.isRequired,
  currentFilterReportTypes: PropTypes.array.isRequired,
  reporters: PropTypes.array.isRequired,
  reportedByFilter: PropTypes.array.isRequired,
  eventFilterTracker: PropTypes.object.isRequired,
  updateEventFilter: PropTypes.func.isRequired,
  eventTypes: PropTypes.array.isRequired,
  state: PropTypes.object.isRequired,
  onResetPopoverFilters: PropTypes.func.isRequired,
  setReportTypeFilterText: PropTypes.func.isRequired
};

export default memo(Filters);
