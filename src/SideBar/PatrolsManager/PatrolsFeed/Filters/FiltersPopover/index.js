import React, { useContext, useId, useRef, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcUrlForImage } from '../../../../../utils/img';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { TrackerContext } from '../../../../../utils/analytics';
import useModalPopover from '../../../../utils/useModalPopover';

import Select from '../../../../../Select';
import SelectListGroup from '../../../../../SelectListGroup';
import SvgIcon from '../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const CHECKBOX_LIST_COLUMN_COUNT = 2;

// The order the statuses read in, which is the order a patrol moves through
// them rather than the alphabet.
const STATUS_IDS = ['active', 'done', 'cancelled'];

const getPatrolTypeLabel = (patrolType) => patrolType.display;
const getPatrolTypeValue = (patrolType) => patrolType.id;
const getTeamLeadLabel = (teamLead) => teamLead.name;
const getTeamLeadValue = (teamLead) => teamLead.id;

const renderPatrolTypeIcon = (patrolType) => <SvgIcon color="black" iconId={patrolType.icon_id} type="patrols" />;

const renderTeamLeadIcon = (teamLead) => !!teamLead.image_url
  && <SvgIcon imageUrl={calcUrlForImage(teamLead.image_url)} type="subjects" />;

const FiltersPopover = ({ className = '', onClose, ref, trigger, ...otherProps }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFilters.filtersPopover' });

  const tracker = useContext(TrackerContext);

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrolLeaders = useSelector((state) => state.data.patrolTeamAndTrackingOptions.leaders);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const bodyRef = useRef(null);

  const patrolTypesListId = useId();
  const statusListId = useId();
  const teamLeadSelectId = useId();

  const [isTeamLeadMenuOpen, setIsTeamLeadMenuOpen] = useState(false);

  const { focusPopover, onKeyDown } = useModalPopover(bodyRef, trigger, onClose, isTeamLeadMenuOpen);

  // A filter can outlive the leader it names, and it still filters the feed,
  // so it stays in the select where it can be removed.
  const teamLeads = patrolFilter.filter.tracked_by.map((leaderId) => patrolLeaders
    .find((patrolLeader) => patrolLeader.id === leaderId) ?? { id: leaderId, name: t('unknownTeamLeadLabel') });

  const statusOptions = STATUS_IDS.map((statusId) => ({ label: t(`patrolStatuses.${statusId}`), value: statusId }));

  const onChangePatrolTypes = (patrolTypeIds) => {
    dispatch(updatePatrolFilter({ filter: { patrol_type: patrolTypeIds } }));

    tracker.track(patrolTypeIds.length ? 'Set the patrol types filter' : 'Clear the patrol types filter');
  };

  const onChangeStatus = (statusIds) => {
    dispatch(updatePatrolFilter({ status: statusIds }));

    tracker.track(statusIds.length ? 'Set the status filter' : 'Clear the status filter');
  };

  const onChangeTeamLeads = (selectedTeamLeads) => {
    dispatch(updatePatrolFilter({ filter: { tracked_by: selectedTeamLeads.map((teamLead) => teamLead.id) } }));

    tracker.track(selectedTeamLeads.length ? 'Set the team lead filter' : 'Clear the team lead filter');
  };

  // The reset button leaves with the selection it clears, so focus moves on to
  // the list, or to the popover when the list is empty, rather than the page.
  const focusCheckboxList = (listId) => {
    const firstCheckbox = document.getElementById(listId).querySelector('input');

    if (firstCheckbox) {
      firstCheckbox.focus();
    } else {
      focusPopover();
    }
  };

  const onResetPatrolTypes = () => {
    dispatch(updatePatrolFilter({ filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type } }));

    focusCheckboxList(patrolTypesListId);

    tracker.track('Click reset the patrol types filter');
  };

  const onResetStatus = () => {
    dispatch(updatePatrolFilter({ status: INITIAL_FILTER_STATE.status }));

    focusCheckboxList(statusListId);

    tracker.track('Click reset the status filter');
  };

  const renderCheckboxList = (selectListGroupProps, onReset, resetButtonLabel) => <div
    className={styles.checkboxSection}
    >
    {selectListGroupProps.value.length > 0 && <button
      aria-label={resetButtonLabel}
      className={styles.resetButton}
      onClick={onReset}
      type="button"
    >
      {t('resetButton')}
    </button>}

    <SelectListGroup
      className={styles.checkboxList}
      columnCount={CHECKBOX_LIST_COLUMN_COUNT}
      {...selectListGroupProps}
    />
  </div>;

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
      <div className={styles.teamLeadField}>
        <label className={styles.label} htmlFor={teamLeadSelectId}>{t('teamLeadLabel')}</label>

        <Select
          // Touch devices blur the input on a pick, which would leave the
          // dialog without focus and so without its Escape and Tab handling.
          blurInputOnSelect={false}
          getOptionLabel={getTeamLeadLabel}
          getOptionValue={getTeamLeadValue}
          inputId={teamLeadSelectId}
          isMulti
          // Kept in the dialog, so choosing an option is no click outside it.
          menuPortalTarget={null}
          menuPosition="fixed"
          onChange={onChangeTeamLeads}
          onMenuClose={() => setIsTeamLeadMenuOpen(false)}
          onMenuOpen={() => setIsTeamLeadMenuOpen(true)}
          options={patrolLeaders}
          renderOptionIcon={renderTeamLeadIcon}
          value={teamLeads}
        />
      </div>

      {renderCheckboxList(
        {
          id: statusListId,
          label: t('statusLabel'),
          onChange: onChangeStatus,
          options: statusOptions,
          value: patrolFilter.status,
        },
        onResetStatus,
        t('resetStatusButtonLabel')
      )}

      {renderCheckboxList(
        {
          getOptionLabel: getPatrolTypeLabel,
          getOptionValue: getPatrolTypeValue,
          id: patrolTypesListId,
          label: t('patrolTypeLabel'),
          onChange: onChangePatrolTypes,
          options: patrolTypes,
          renderOptionIcon: renderPatrolTypeIcon,
          value: patrolFilter.filter.patrol_type,
        },
        onResetPatrolTypes,
        t('resetPatrolTypesButtonLabel')
      )}
    </Popover.Body>
  </Popover>;
};

export default FiltersPopover;
