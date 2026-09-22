import React, { useContext, useId } from 'react';
import isEqual from 'react-fast-compare';
import Popover from 'react-bootstrap/Popover';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { TrackerContext } from '../../../../../utils/analytics';

import ReportedBySelect from '../../../../../ReportedBySelect';
import SvgIcon from '../../../../../SvgIcon';

import * as colorVariables from '../../../../../common/styles/vars/colors.module.scss';
import * as styles from './styles.module.scss';

const ALL_OPTION_ID = 'all';

const STATUS_COLOR_BY_STATUS_ID = {
  active: colorVariables.patrolActiveThemeColor,
  cancelled: colorVariables.patrolCancelledThemeColor,
  done: colorVariables.patrolDoneThemeColor,
};

// The order the statuses read in, which is the order a patrol moves through
// them rather than the alphabet.
const STATUS_IDS = ['active', 'done', 'cancelled'];

const toggleCheckedId = (checkedIds, clickedId) => {
  if (clickedId === ALL_OPTION_ID) {
    return [];
  }

  return checkedIds.includes(clickedId)
    ? checkedIds.filter((checkedId) => checkedId !== clickedId)
    : [...checkedIds, clickedId];
};

const FiltersPopover = ({ ref, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters.filtersPopover' });

  const tracker = useContext(TrackerContext);

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrolLeaders = useSelector((state) => state.data.patrolTeamAndTrackingOptions.leaders);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const patrolTypesLabelId = useId();
  const statusLabelId = useId();
  const trackedByLabelId = useId();

  const isPatrolTypesFilterModified = !isEqual(
    INITIAL_FILTER_STATE.filter.patrol_type,
    patrolFilter.filter.patrol_type
  );
  const isStatusFilterModified = !isEqual(INITIAL_FILTER_STATE.status, patrolFilter.status);
  const isTrackedByFilterModified = !isEqual(INITIAL_FILTER_STATE.filter.tracked_by, patrolFilter.filter.tracked_by);

  const isAnyFilterModified = isPatrolTypesFilterModified || isStatusFilterModified || isTrackedByFilterModified;

  // A filter can outlive the leader it names, so leaders that are gone are
  // dropped instead of reaching the select as holes.
  const selectedLeaders = patrolFilter.filter.tracked_by
    .map((leaderId) => patrolLeaders.find((patrolLeader) => patrolLeader.id === leaderId))
    .filter(Boolean);

  const statusOptions = [
    { id: ALL_OPTION_ID, label: t('checkBoxAllOption') },
    ...STATUS_IDS.map((statusId) => ({
      icon: <SvgIcon color={STATUS_COLOR_BY_STATUS_ID[statusId]} iconId="generic_rep" type="patrols" />,
      id: statusId,
      label: t(`patrolStatuses.${statusId}`),
    })),
  ];

  const patrolTypeOptions = [
    { id: ALL_OPTION_ID, label: t('checkBoxAllOption') },
    ...patrolTypes.map((patrolType) => ({
      icon: patrolType.icon_id ? <SvgIcon color="black" iconId={patrolType.icon_id} type="patrols" /> : null,
      id: patrolType.id,
      label: patrolType.display,
    })),
  ];

  const onChangePatrolTypes = (patrolTypeId) => {
    dispatch(updatePatrolFilter({
      filter: { patrol_type: toggleCheckedId(patrolFilter.filter.patrol_type, patrolTypeId) },
    }));

    tracker.track(patrolTypeId === ALL_OPTION_ID ? 'Clear the patrol types filter' : 'Set the patrol types filter');
  };

  const onChangeStatus = (statusId) => {
    dispatch(updatePatrolFilter({ status: toggleCheckedId(patrolFilter.status, statusId) }));

    tracker.track(statusId === ALL_OPTION_ID ? 'Clear the status filter' : 'Set the status filter');
  };

  const onChangeTrackedBy = (leaders) => {
    dispatch(updatePatrolFilter({ filter: { tracked_by: uniq((leaders ?? []).map((leader) => leader.id)) } }));

    tracker.track(leaders?.length ? 'Set the tracked by filter' : 'Clear the tracked by filter');
  };

  const onResetAll = () => {
    dispatch(updatePatrolFilter({
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
      },
      status: INITIAL_FILTER_STATE.status,
    }));

    tracker.track('Click reset all patrol filters');
  };

  const onResetPatrolTypes = () => {
    dispatch(updatePatrolFilter({ filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type } }));

    tracker.track('Click reset the patrol types filter');
  };

  const onResetStatus = () => {
    dispatch(updatePatrolFilter({ status: INITIAL_FILTER_STATE.status }));

    tracker.track('Click reset the status filter');
  };

  const onResetTrackedBy = () => {
    dispatch(updatePatrolFilter({ filter: { tracked_by: INITIAL_FILTER_STATE.filter.tracked_by } }));

    tracker.track('Click reset the tracked by filter');
  };

  // Nothing checked reads as everything included, which is what the "All"
  // option stands for.
  const renderCheckboxList = (options, checkedIds, onChange) => <ul className={styles.checkboxList}>
    {options.map((option) => <li key={option.id}>
      <label>
        <input
          checked={(checkedIds.length ? checkedIds : [ALL_OPTION_ID]).includes(option.id)}
          onChange={() => onChange(option.id)}
          type="checkbox"
        />

        {option.icon}

        <span>{option.label}</span>
      </label>
    </li>)}
  </ul>;

  return <Popover {...otherProps} className={styles.filtersPopover} ref={ref}>
    <Popover.Header as="div" className={styles.header}>
      <h2 className={styles.title}>{t('title')}</h2>

      {!!isAnyFilterModified && <button className={styles.resetButton} onClick={onResetAll} type="button">
        {t('resetAllButton')}
      </button>}
    </Popover.Header>

    <Popover.Body className={styles.body}>
      <div aria-labelledby={trackedByLabelId} className={styles.trackedBySection} role="group">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel} id={trackedByLabelId}>{t('trackedByLabel')}</h3>

          {!!isTrackedByFilterModified && <button
            className={styles.resetButton}
            onClick={onResetTrackedBy}
            type="button"
          >
            {t('resetButton')}
          </button>}
        </div>

        <ReportedBySelect
          className={styles.trackedBySelect}
          isMulti
          onChange={onChangeTrackedBy}
          options={patrolLeaders}
          placeholder={t('reportedByPlaceholder')}
          value={selectedLeaders}
        />
      </div>

      <div aria-labelledby={statusLabelId} className={styles.checkboxSection} role="group">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel} id={statusLabelId}>{t('statusLabel')}</h3>

          {!!isStatusFilterModified && <button className={styles.resetButton} onClick={onResetStatus} type="button">
            {t('resetButton')}
          </button>}
        </div>

        {renderCheckboxList(statusOptions, patrolFilter.status, onChangeStatus)}
      </div>

      <div aria-labelledby={patrolTypesLabelId} className={styles.checkboxSection} role="group">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel} id={patrolTypesLabelId}>{t('patrolTypeLabel')}</h3>

          {!!isPatrolTypesFilterModified && <button
            className={styles.resetButton}
            onClick={onResetPatrolTypes}
            type="button"
          >
            {t('resetButton')}
          </button>}
        </div>

        {renderCheckboxList(patrolTypeOptions, patrolFilter.filter.patrol_type, onChangePatrolTypes)}
      </div>
    </Popover.Body>
  </Popover>;
};

export default FiltersPopover;
