import React, { memo, useCallback } from 'react';
import { connect } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { trackEventFactory, PATROL_FILTER_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const patrolFilterTracker = trackEventFactory(PATROL_FILTER_CATEGORY);

const PatrolFilterSettings = (props) => {
  const { handleFilterOptionChange, patrolFilter } = props;
  const { filter: { patrols_overlap_daterange } } = patrolFilter;

  const startInfo = props => (
    <Tooltip className={styles.filterTooltip} {...props}>Include patrols starting within the date range</Tooltip>
  );

  const overlapInfo = props => (
    <Tooltip className={styles.filterTooltip} {...props}>Include patrols whose start to end date range overlaps with the date range</Tooltip>
  );

  const handleOptionClick = useCallback((e) => {
    handleFilterOptionChange(e);
    patrolFilterTracker.track(`Select "${e.target.value === 'start_dates' ? 'Filter by start date' : 'Filter by date range overlap'}"`);
  }, [handleFilterOptionChange]);

  return <div className={styles.filterSelection}>
    <form>
      <fieldset>
        <div>
          <OverlayTrigger placement="top" overlay={startInfo} delay={{ show: 1000 }}>
            <span>
              <input
                type="radio"
                id="start_dates"
                value="start_dates"
                checked={!patrols_overlap_daterange}
                onChange={handleOptionClick}
              /><label forHtml="start_dates">Filter by start date</label>
            </span>
          </OverlayTrigger>
        </div>
        <div>
          <OverlayTrigger placement="top" overlay={overlapInfo} delay={{ show: 1000 }}>
            <span>
              <input
                type="radio"
                id="overlap_dates"
                value="overlap_dates"
                checked={patrols_overlap_daterange}
                onChange={handleOptionClick}
              /><label htmlFor="overlap_dates">Filter by date range overlap</label>
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