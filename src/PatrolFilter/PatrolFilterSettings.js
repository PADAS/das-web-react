import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilterSettings = (props) => {
  const { handleFilterOptionChange, patrolFilter } = props;
  const { filter: { patrols_overlap_daterange } } = patrolFilter;
  const { t } = useTranslation('filters', { keyPrefix: 'patrolFiltersSettings' });

  const startInfo = props => (
    <Tooltip className={styles.filterTooltip} {...props}>
      {t('patrolWithinRangeTooltip')}
    </Tooltip>
  );

  const overlapInfo = props => (
    <Tooltip className={styles.filterTooltip} {...props}>
      {t('patrolOverlapsRangeTooltip')}
    </Tooltip>
  );

  const handleOptionClick = useCallback((e) => {
    handleFilterOptionChange(e);
    patrolFilterTracker.track(`Select "${e.target.value === 'start_dates' ? 'Filter by start date' : 'Filter by date range overlap'}"`);
  }, [handleFilterOptionChange]);

  return <div>
    <form>
      <fieldset>
        <div>
          <OverlayTrigger placement="top" overlay={startInfo} delay={{ show: 1000 }}>
            <span className={styles.settingsInputContainer}>
              <input
                type="radio"
                id="start_dates"
                value="start_dates"
                checked={!patrols_overlap_daterange}
                onChange={handleOptionClick}
              />
              <label htmlFor="start_dates">
                {t('byStartDateLabel')}
              </label>
            </span>
          </OverlayTrigger>
        </div>
        <div>
          <OverlayTrigger placement="top" overlay={overlapInfo} delay={{ show: 1000 }}>
            <span className={styles.settingsInputContainer}>
              <input
                type="radio"
                id="overlap_dates"
                value="overlap_dates"
                checked={patrols_overlap_daterange}
                onChange={handleOptionClick}
              />
              <label htmlFor="overlap_dates">
                {t('byRangeDateLabel')}
              </label>
            </span>
          </OverlayTrigger>
        </div>
      </fieldset>
    </form>
  </div>;
};

const mapStateToProps = (state) =>
  ({
    patrolFilter: state.data.patrolFilter,
  });

export default connect(mapStateToProps, null)(memo(PatrolFilterSettings));