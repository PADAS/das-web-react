import React, { useId } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const TOOLTIP_SHOW_DELAY = 1000;

const Settings = ({ onChange }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFiltersSettings' });

  const patrolsOverlapDateRange = useSelector(
    (state) => state.data.patrolFilter.filter.patrols_overlap_daterange
  );

  const groupName = useId();
  const overlapDatesId = useId();
  const startDatesId = useId();

  return <fieldset className={styles.settings}>
    <legend className="sr-only">{t('dateFilterModeLabel')}</legend>

    <OverlayTrigger
      delay={{ show: TOOLTIP_SHOW_DELAY }}
      overlay={<Tooltip>{t('patrolWithinRangeTooltip')}</Tooltip>}
      placement="top"
    >
      <div className={styles.option}>
        <input
          checked={!patrolsOverlapDateRange}
          id={startDatesId}
          name={groupName}
          onChange={() => onChange(false)}
          type="radio"
        />

        <label htmlFor={startDatesId}>{t('byStartDateLabel')}</label>
      </div>
    </OverlayTrigger>

    <OverlayTrigger
      delay={{ show: TOOLTIP_SHOW_DELAY }}
      overlay={<Tooltip>{t('patrolOverlapsRangeTooltip')}</Tooltip>}
      placement="top"
    >
      <div className={styles.option}>
        <input
          checked={patrolsOverlapDateRange}
          id={overlapDatesId}
          name={groupName}
          onChange={() => onChange(true)}
          type="radio"
        />

        <label htmlFor={overlapDatesId}>{t('byRangeDateLabel')}</label>
      </div>
    </OverlayTrigger>
  </fieldset>;
};

export default Settings;
