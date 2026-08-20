import React, { memo, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import uniq from 'lodash-es/uniq';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UserIcon } from '../../common/images/icons/user-profile.svg';

import { EVENT_STATE_CHOICES, PREVIEW_FEATURES } from '../../constants';
import { INITIAL_FILTER_STATE } from '../../ducks/event-filter';
import { usePreviewFeature } from '../../hooks';

import CheckMark from '../../Checkmark';
import PriorityPicker from '../../PriorityPicker';
import ReportedBySelect from '../../ReportedBySelect';
import ReportTypeMultiSelect from '../../ReportTypeMultiSelect';

import * as styles from '../styles.module.scss';

const StateSelector = ({ onStateSelect, state }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'filters' });

  // Remove this flag and the `.filter` below once community input is enabled
  // for all tenants.
  const communityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);

  return <ul
      className={styles.stateList}
      data-testid="state-filter-options"
    >
    {EVENT_STATE_CHOICES
      .filter((choice) => communityInputEnabled || choice.key !== 'review')
      .map((choice) =>
        <li key={choice.value}>
          <Button
            className={isEqual(choice.value, state) ? styles.activeState : ''}
            onClick={() => onStateSelect(choice)}
            variant="link"
          >
            {t(`stateSelector.${choice.key}`)}
          </Button>
        </li>)}
  </ul>;
};

const Filters = ({
  currentFilterReportTypes,
  eventFilterTracker,
  eventTypes,
  isEventTypeFilterEmpty,
  isFilterModified,
  isPriorityFilterModified,
  isReportedByFilterModified,
  isStateFilterModified,
  onResetPopoverFilters,
  priority,
  reportedByFilter,
  reporters,
  reportTypeFilterText,
  setReportTypeFilterText,
  state,
  updateEventFilter,
}) => {
  const { t } = useTranslation('filters', { keyPrefix: 'filters' });

  const eventTypeIds = useMemo(() => eventTypes.map((eventType) => eventType.id), [eventTypes]);

  const selectedEventTypesCount = useMemo(
    () => eventTypeIds.filter((eventTypeId) => currentFilterReportTypes.includes(eventTypeId)).length,
    [currentFilterReportTypes, eventTypeIds]
  );

  const someReportTypesChecked = !isEventTypeFilterEmpty && !!selectedEventTypesCount;
  const noReportTypesChecked = !isEventTypeFilterEmpty && !someReportTypesChecked;

  let appliedFilterLabel = t('reportTypesSelectionLabels.noneSelected');
  if (isEventTypeFilterEmpty){
    appliedFilterLabel = t('reportTypesSelectionLabels.allSelected');
  } else if (someReportTypesChecked) {
    appliedFilterLabel = t('reportTypesSelectionLabels.someSelected', {
      eventTypeIDsLength: eventTypeIds.length,
      reportTypesCheckedCount: selectedEventTypesCount,
    });
  }

  const selectedReporters = useMemo(() => reportedByFilter?.length > 0
    ? reportedByFilter
      .map((reportedById) => reporters.find((reporter) => reporter.id === reportedById))
      .filter((item) => !!item)
    : [], [reportedByFilter, reporters]);

  const onAllEventTypesClick = useCallback((event) => {
    event.stopPropagation();

    if (isEventTypeFilterEmpty) {
      eventFilterTracker.track('Uncheck All Event Types Filter');

      updateEventFilter({ filter: { event_type: [null] } });
    } else {
      eventFilterTracker.track('Check All Event Types Filter');

      updateEventFilter({ filter: { event_type: [] } });
    }
  }, [eventFilterTracker, isEventTypeFilterEmpty, updateEventFilter]);

  const onEventTypesReset = useCallback(() => {
    eventFilterTracker.track('Reset Event Types Filter');

    setReportTypeFilterText('');
    updateEventFilter({ filter: { event_type: [] } });
  }, [eventFilterTracker, setReportTypeFilterText, updateEventFilter]);

  const onCategoryToggle = useCallback((category) => {
    const idsOfEventTypesContainedByToggledCategory = eventTypes
      .filter((eventType) => {
        const eventTypeCategoryValue = eventType.version === 1
          ? eventType.category.value
          : eventType.category;

        return eventTypeCategoryValue === category.value;
      }).map((eventType) => eventType.id);

    const areAllEventTypesInCurrentFilter = idsOfEventTypesContainedByToggledCategory.every(
      (eventTypeId) => currentFilterReportTypes.includes(eventTypeId)
    );

    let newFilteredEventTypes;
    if (isEventTypeFilterEmpty) {
      // If no event types are filtered we just filter out all the event types
      // contained by the toggled category and keep the rest.
      newFilteredEventTypes = eventTypeIds
        .filter((eventTypeId) => !idsOfEventTypesContainedByToggledCategory.includes(eventTypeId));

      eventFilterTracker.track('Uncheck Event Type Category Filter');
    } else if (areAllEventTypesInCurrentFilter) {
      // If there are event types filtered and all the event types contained by
      // the toggled category are in the current filter, we just filter them
      // out from the current filtered event types and keep the rest.
      newFilteredEventTypes = currentFilterReportTypes
        .filter((eventTypeId) => !idsOfEventTypesContainedByToggledCategory.includes(eventTypeId));

      eventFilterTracker.track('Uncheck Event Type Category Filter');
    } else {
      // If there are event types filtered and not all the event types
      // contained by the toggled category are in the current filter we add
      // them all to the currently filtered event types.
      const uniqEventTypeIdsFiltered = uniq([
        ...currentFilterReportTypes,
        ...idsOfEventTypesContainedByToggledCategory
      ]);
      newFilteredEventTypes = uniqEventTypeIdsFiltered.length === eventTypeIds.length ? [] : uniqEventTypeIdsFiltered;

      eventFilterTracker.track('Check Event Type Category Filter');
    }

    updateEventFilter({ filter: { event_type: newFilteredEventTypes } });
  }, [
    eventTypeIds,
    eventTypes,
    isEventTypeFilterEmpty,
    currentFilterReportTypes,
    eventFilterTracker,
    updateEventFilter,
  ]);

  const onReportedByChange = useCallback((values) => {
    const hasValue = !!values?.length;

    updateEventFilter({
      filter: {
        reported_by: hasValue ? uniq(values.map((reportedBy) => reportedBy.id)) : [],
      }
    });

    eventFilterTracker.track(
      `${hasValue ? 'Set' : 'Clear'} 'Reported By' Filter`,
      hasValue ? `${values.length} reporters` : null
    );
  }, [eventFilterTracker, updateEventFilter]);

  const onPriorityPickerSelect = useCallback((selectedPriority) => {
    const newPriorityFilter = priority.includes(selectedPriority)
      ? priority.filter((filteredPriority) => filteredPriority !== selectedPriority)
      : [...priority, selectedPriority];

    updateEventFilter({
      filter: {
        priority: newPriorityFilter,
      },
    });

    eventFilterTracker.track('Set Priority Filter', newPriorityFilter.toString());
  }, [eventFilterTracker, priority, updateEventFilter]);

  const onEventTypeToggle = useCallback((eventType) => {
    const isIncludedInFilter = isEventTypeFilterEmpty ? true : currentFilterReportTypes.includes(eventType.id);
    if (isIncludedInFilter) {
      updateEventFilter({
        filter: {
          event_type: (isEventTypeFilterEmpty ? eventTypeIds : currentFilterReportTypes)
            .filter((eventTypeId) => eventTypeId !== eventType.id)
        },
      });

      eventFilterTracker.track('Uncheck Event Type Filter');
    } else {
      const eventTypeIdsFiltered = [...currentFilterReportTypes, eventType.id];
      updateEventFilter({
        filter: {
          event_type: eventTypeIdsFiltered.length === eventTypeIds.length ? [] : eventTypeIdsFiltered,
        },
      });

      eventFilterTracker.track('Check Event Type Filter');
    }
  }, [currentFilterReportTypes, eventFilterTracker, eventTypeIds, isEventTypeFilterEmpty, updateEventFilter]);

  const onStateReset = useCallback((event) => {
    event.stopPropagation();

    updateEventFilter({ state: INITIAL_FILTER_STATE.state });

    eventFilterTracker.track('Click Reset State Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onPriorityReset = useCallback((event) => {
    event.stopPropagation();

    updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });

    eventFilterTracker.track('Click Reset Priority Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onReportedByReset = useCallback((event) => {
    event.stopPropagation();

    updateEventFilter({ filter: { reported_by: INITIAL_FILTER_STATE.filter.reported_by } });

    eventFilterTracker.track('Click Reset Reported By Filter');
  }, [eventFilterTracker, updateEventFilter]);

  const onStateSelect = useCallback((option) => {
    if (state !== option.value) {
      updateEventFilter({ state: option.value });

      eventFilterTracker.track(`Select '${option.value}' State Filter`);
    }
  }, [eventFilterTracker, state, updateEventFilter]);

  return <>
    <Popover.Header>
      <div className={styles.popoverTitle}>
        {t('title')}

        <Button
          disabled={!isFilterModified}
          onClick={onResetPopoverFilters}
          size="sm"
          type="button"
          variant="light"
        >
          {t('resetAllButton')}
        </Button>
      </div>
    </Popover.Header>

    <Popover.Body>
      <div className={styles.filterRow}>
        <label>
          {t('stateLabel')}
        </label>

        <StateSelector onStateSelect={onStateSelect} state={state} />

        <Button
          disabled={!isStateFilterModified}
          onClick={onStateReset}
          size="sm"
          type="button"
          variant="light"
        >
          {t('resetButton')}
        </Button>
      </div>

      <div className={`${styles.filterRow} ${styles.priorityRow}`}>
        <label>{t('priorityPickerLabel')}</label>

        <PriorityPicker
          className={styles.priorityPicker}
          isMulti
          onSelect={onPriorityPickerSelect}
          selected={priority}
        />
        <Button
          disabled={!isPriorityFilterModified}
          onClick={onPriorityReset}
          size="sm"
          type="button"
          variant="light"
        >
          {t('resetButton')}
        </Button>
      </div>

      <div className={styles.filterRow}>
        <UserIcon className={styles.userIcon}/>

        <ReportedBySelect
          className={styles.reportedBySelect}
          isMulti={true}
          onChange={onReportedByChange}
          value={selectedReporters}
          menuRef={document.body}
        />

        <Button
          disabled={!isReportedByFilterModified}
          onClick={onReportedByReset}
          size="sm"
          type="button"
          variant="light"
        >
          {t('resetButton')}
        </Button>
      </div>

      <div className={`${styles.filterRow} ${styles.reportTypeRow}`}>
        <h5 className={`${styles.filterTitle} ${styles.reportFilterTitle}`}>
          <div className={styles.toggleAllReportTypes}>
            <CheckMark
              fullyChecked={!noReportTypesChecked && !someReportTypesChecked}
              onClick={onAllEventTypesClick}
              partiallyChecked={!noReportTypesChecked && someReportTypesChecked}
            />

            <span>{t('reportTypesAllLabel')}</span>
          </div>

          {t('reportTypesLabel')}

          <small>{appliedFilterLabel}</small>

          <Button
            disabled={isEventTypeFilterEmpty}
            onClick={onEventTypesReset}
            size="sm"
            type="button"
            variant="light"
          >
            {t('resetButton')}
          </Button>
        </h5>

        <ReportTypeMultiSelect
          filter={reportTypeFilterText}
          onCategoryToggle={onCategoryToggle}
          onFilterChange={setReportTypeFilterText}
          onFilteredItemsSelect={(eventTypes) => updateEventFilter({
            filter: {
              event_type: eventTypes.map((eventType) => eventType.id),
            },
          })}
          onTypeToggle={onEventTypeToggle}
          selectedReportTypeIDs={currentFilterReportTypes}
        />
      </div>
    </Popover.Body>
  </>;
};

export default memo(Filters);
