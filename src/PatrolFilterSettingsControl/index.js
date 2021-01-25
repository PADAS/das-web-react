import React, { forwardRef, useRef, memo } from 'react';
import { connect } from 'react-redux';
import { Overlay, Popover } from 'react-bootstrap';
import styles from './styles.module.scss';
import { setPatrolFilterAllowsOverlap } from '../ducks/patrol-filter';

const PatrolFilterSettingsControl = forwardRef((props, ref) => {
  const { patrolsOverlapFilter, setPatrolFilterAllowsOverlap, isOpen, target, container, popoverClassName } = props;

  const handleOptionChange = (e) => {
    setPatrolFilterAllowsOverlap(e.currentTarget.value === 'overlap_dates');
  };

  return <div ref={ref}>
    <Overlay show={isOpen} target={target.current} container={container.current} placement='bottom' >
    <Popover id="patrol-filter-settings" className={styles.popover} title="Patrol Filter Settings">
      <Popover.Content ref={ref}>
        <div className={styles.filterSelection}>
          <fieldset>
            <form>
              <div>
                <span>
                  <input
                    type="radio"
                    value="start_dates"
                    checked={!patrolsOverlapFilter}
                    onChange={handleOptionChange}
                  /><label forHtml="start_dates">Include patrols starting within date range</label>
                </span>
              </div>
              <div>
                <span>
                  <input
                    type="radio"
                    value="overlap_dates"
                    checked={patrolsOverlapFilter}
                    onChange={handleOptionChange}
                  /><label htmlFor="overlap_dates">Include patrols whose start to end date range overlaps with date range </label>
                </span>
              </div>
            </form>
          </fieldset>
        </div>
      </Popover.Content>
    </Popover>
  </Overlay>
  </div>;
});

const mapStateToProps = ({ data: { patrolsOverlapFilter } }) => {
  return {patrolsOverlapFilter};
};

export default connect(mapStateToProps, {setPatrolFilterAllowsOverlap})(memo(PatrolFilterSettingsControl));

PatrolFilterSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};