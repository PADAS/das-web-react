import React, { useContext, useId, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EVENT_STATE_CHOICES, PREVIEW_FEATURES, REPORT_PRIORITIES } from '../../constants';
import { getGlobalSchemaReportedBy } from '../../selectors';
import { INITIAL_FILTER_STATE, updateEventFilter } from '../../ducks/event-filter';
import { PRIORITY_COLOR_MAP } from '../../utils/events';
import { TrackerContext } from '../../utils/analytics';
import useModalPopover from '../../hooks/useModalPopover';
import { usePreviewFeature } from '../../hooks';

import EventTypesFilter from './EventTypesFilter';
import ReporterSelect from '../../ReporterSelect';
import SelectListGroup from '../../SelectListGroup';

import * as styles from './styles.module.scss';

const CHECKBOX_LIST_COLUMN_COUNT = 2;

const ALL_STATE_KEY = 'all';

const REVIEW_STATE_KEY = 'review';

const renderPriorityIcon = (priority) => <span
  className={styles.optionDot}
  style={{ backgroundColor: PRIORITY_COLOR_MAP[priority.value].base }}
/>;

const renderStateIcon = (state) => <span className={`${styles.optionDot} ${styles[state.value]}`} />;

const FiltersPopover = ({ className = '', onClose, ref, trigger, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'eventFilters.filtersPopover' });

  // Remove this flag and the `.filter` below once community input is enabled
  // for all tenants.
  const isCommunityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const reporters = useSelector(getGlobalSchemaReportedBy);

  const tracker = useContext(TrackerContext);

  const bodyRef = useRef(null);

  const eventTypesFilterId = useId();
  const priorityListId = useId();
  const reportedBySelectId = useId();
  const stateListId = useId();

  const [eventTypeFilterText, setEventTypeFilterText] = useState('');
  const [isReportedByMenuOpen, setIsReportedByMenuOpen] = useState(false);

  const { focusPopover, onKeyDown } = useModalPopover(bodyRef, trigger, onClose, isReportedByMenuOpen);

  // A filter can outlive the reporter it names, and it still filters the feed,
  // so it stays in the select where it can be removed.
  const selectedReporters = eventFilter.filter.reported_by.map((reporterId) => reporters
    .find((reporter) => reporter.id === reporterId) ?? { id: reporterId, name: t('unknownReporterLabel') });

  const selectedStateKeys = EVENT_STATE_CHOICES
    .filter((choice) => !!choice.value && choice.value.every((state) => eventFilter.state?.includes(state)))
    .map((choice) => choice.key);

  const priorityOptions = REPORT_PRIORITIES.map((priority) => ({
    label: t(`priorities.${priority.key}`),
    value: priority.value,
  }));

  const stateOptions = EVENT_STATE_CHOICES
    .filter((choice) => choice.key !== ALL_STATE_KEY && (isCommunityInputEnabled || choice.key !== REVIEW_STATE_KEY))
    .map((choice) => ({ label: t(`states.${choice.key}`), value: choice.key }));

  const onChangeEventTypes = (eventTypeIds) => {
    dispatch(updateEventFilter({ filter: { event_type: eventTypeIds } }));
  };

  const onChangePriorities = (priorities) => {
    dispatch(updateEventFilter({ filter: { priority: priorities } }));

    tracker.track(priorities.length ? 'Set the priority filter' : 'Clear the priority filter');
  };

  const onChangeReporters = (selectedReporterOptions) => {
    dispatch(updateEventFilter({ filter: { reported_by: selectedReporterOptions.map((reporter) => reporter.id) } }));

    tracker.track(selectedReporterOptions.length ? 'Set the reported by filter' : 'Clear the reported by filter');
  };

  // No state checked means every state, which the API reads from no state at all.
  const onChangeStates = (stateKeys) => {
    dispatch(updateEventFilter({
      state: stateKeys.length > 0
        ? EVENT_STATE_CHOICES.filter((choice) => stateKeys.includes(choice.key)).flatMap((choice) => choice.value)
        : null,
    }));

    tracker.track(stateKeys.length ? 'Set the state filter' : 'Clear the state filter');
  };

  // The reset button leaves with the selection it clears, so focus moves on to
  // the section's first field, or to the popover when it has none.
  const focusSection = (sectionId) => {
    const firstInput = document.getElementById(sectionId).querySelector('input');

    if (firstInput) {
      firstInput.focus();
    } else {
      focusPopover();
    }
  };

  const onResetEventTypes = () => {
    setEventTypeFilterText('');

    dispatch(updateEventFilter({ filter: { event_type: INITIAL_FILTER_STATE.filter.event_type } }));

    focusSection(eventTypesFilterId);

    tracker.track('Click reset the event types filter');
  };

  const onResetPriorities = () => {
    dispatch(updateEventFilter({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } }));

    focusSection(priorityListId);

    tracker.track('Click reset the priority filter');
  };

  const onResetStates = () => {
    dispatch(updateEventFilter({ state: INITIAL_FILTER_STATE.state }));

    focusSection(stateListId);

    tracker.track('Click reset the state filter');
  };

  const renderResetButton = (onReset, resetButtonLabel) => <button
    aria-label={resetButtonLabel}
    className={styles.resetButton}
    onClick={onReset}
    type="button"
    >
    {t('resetButton')}
  </button>;

  return <Popover
    aria-label={t('title')}
    aria-modal="true"
    className={`${styles.filtersPopover} ${className}`}
    onKeyDown={onKeyDown}
    ref={ref}
    role="dialog"
    tabIndex={-1}
    {...otherProps}
    >
    <Popover.Body className={styles.body} ref={bodyRef}>
      <div className={styles.reportedByField}>
        <label className={styles.label} htmlFor={reportedBySelectId}>{t('reportedByLabel')}</label>

        <ReporterSelect
          // Touch devices blur the input on a pick, which would leave the
          // dialog without focus and so without its Escape and Tab handling.
          blurInputOnSelect={false}
          inputId={reportedBySelectId}
          isMulti
          // Kept in the dialog, so choosing an option is no click outside it.
          menuPortalTarget={null}
          menuPosition="fixed"
          onChange={onChangeReporters}
          onMenuClose={() => setIsReportedByMenuOpen(false)}
          onMenuOpen={() => setIsReportedByMenuOpen(true)}
          value={selectedReporters}
        />
      </div>

      <div className={styles.checkboxSection}>
        {!isEqual(INITIAL_FILTER_STATE.state, eventFilter.state)
          && renderResetButton(onResetStates, t('resetStateButtonLabel'))}

        <SelectListGroup
          className={styles.checkboxList}
          columnCount={CHECKBOX_LIST_COLUMN_COUNT}
          id={stateListId}
          label={t('stateLabel')}
          onChange={onChangeStates}
          options={stateOptions}
          renderOptionIcon={renderStateIcon}
          value={selectedStateKeys}
        />
      </div>

      <div className={styles.checkboxSection}>
        {eventFilter.filter.priority.length > 0
          && renderResetButton(onResetPriorities, t('resetPriorityButtonLabel'))}

        <SelectListGroup
          className={styles.checkboxList}
          columnCount={CHECKBOX_LIST_COLUMN_COUNT}
          id={priorityListId}
          label={t('priorityLabel')}
          onChange={onChangePriorities}
          options={priorityOptions}
          renderOptionIcon={renderPriorityIcon}
          value={eventFilter.filter.priority}
        />
      </div>

      <div className={styles.checkboxSection}>
        {eventFilter.filter.event_type.length > 0
          && renderResetButton(onResetEventTypes, t('resetEventTypesButtonLabel'))}

        <EventTypesFilter
          filterText={eventTypeFilterText}
          id={eventTypesFilterId}
          onChange={onChangeEventTypes}
          onChangeFilterText={setEventTypeFilterText}
          value={eventFilter.filter.event_type}
        />
      </div>
    </Popover.Body>
  </Popover>;
};

export default FiltersPopover;
