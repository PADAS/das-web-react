import React, { useId } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import SelectListGroup from '../../../../../../SelectListGroup';

const DATE_FILTER_MODES = { OVERLAP: 'overlap', START_DATE: 'startDate' };

const Settings = ({ className = '', onChange }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFiltersSettings' });

  const patrolsOverlapDateRange = useSelector(
    (state) => state.data.patrolFilter.filter.patrols_overlap_daterange
  );

  const dateFilterModeListId = useId();

  const dateFilterModeOptions = [
    {
      description: t('patrolWithinRangeTooltip'),
      label: t('byStartDateLabel'),
      value: DATE_FILTER_MODES.START_DATE,
    },
    {
      description: t('patrolOverlapsRangeTooltip'),
      label: t('byRangeDateLabel'),
      value: DATE_FILTER_MODES.OVERLAP,
    },
  ];

  return <SelectListGroup
    className={className}
    id={dateFilterModeListId}
    isMulti={false}
    label={t('dateFilterModeLabel')}
    onChange={(dateFilterMode) => onChange(dateFilterMode === DATE_FILTER_MODES.OVERLAP)}
    options={dateFilterModeOptions}
    value={patrolsOverlapDateRange ? DATE_FILTER_MODES.OVERLAP : DATE_FILTER_MODES.START_DATE}
  />;
};

export default Settings;
