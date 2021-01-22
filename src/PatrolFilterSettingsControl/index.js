import React, { forwardRef, useRef, memo } from 'react';
import { connect } from 'react-redux';
import { Overlay, Popover } from 'react-bootstrap';
import styles from './styles.module.scss';
import { setPatrolFilterAllowsOverlap } from '../ducks/patrol-filter';

const PatrolFilterSettingsControl = forwardRef((props, ref) => {
  const { patrolsOverlapFilter, setPatrolFilterAllowsOverlap, isOpen, target, container } = props;

  const handleOptionChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPatrolFilterAllowsOverlap(e.currentTarget.value === 'overlap_dates');
  };

  return <Overlay show={isOpen} target={target.current} container={container.current} placement='bottom' >
    <Popover id="patrol-filter-settings" className={styles.searchSettings} title="Patrol Filter Settings">
      <Popover.Content ref={ref}>
        <div className={styles.filterOption}>
          <label>
            <input
              type="radio"
              value="start_dates"
              checked={!patrolsOverlapFilter}
              onChange={handleOptionChange}
            />
            <span>Include patrols starting within date range</span>
          </label>
        </div>
        <div className={styles.filterOption}>
          <label>
            <input
              type="radio"
              value="overlap_dates"
              checked={patrolsOverlapFilter}
              onChange={handleOptionChange}
            />
            <span>Include patrols whose start to end date range overlaps with date range </span>
          </label>
        </div>
      </Popover.Content>
    </Popover>
  </Overlay>;
});

const mapStateToProps = ({ data: { patrolsOverlapFilter } }) => {
  return {patrolsOverlapFilter};
};

export default connect(mapStateToProps, {setPatrolFilterAllowsOverlap})(memo(PatrolFilterSettingsControl));

PatrolFilterSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};