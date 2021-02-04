import React, { memo } from 'react';
import { connect } from 'react-redux';

import styles from './styles.module.scss';

const PatrolFilterSettings = (props) => {
  const { handleFilterOptionChange, patrolFilter } = props;
  const { filter: { overlap } } = patrolFilter;

  return <div className={styles.filterSelection}>
    <form>
      <fieldset>
        <div>
          <span>
            <input
              type="radio"
              id="start_dates"
              value="start_dates"
              checked={!overlap}
              onChange={handleFilterOptionChange}
            /><label forHtml="start_dates">Include patrols starting within date range</label>
          </span>
        </div>
        <div>
          <span>
            <input
              type="radio"
              id="overlap_dates"
              value="overlap_dates"
              checked={overlap}
              onChange={handleFilterOptionChange}
            /><label htmlFor="overlap_dates">Include patrols whose start to end date range overlaps with date range </label>
          </span>
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