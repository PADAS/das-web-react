import React, { forwardRef, useCallback, useEffect, memo } from 'react';
import { connect } from 'react-redux';
import { Overlay, Popover } from 'react-bootstrap';
import styles from './styles.module.scss';
import { setPatrolFilterAllowsOverlap } from '../ducks/patrol-filter';

const PatrolFilterSettingsControl = forwardRef((props, ref) => {
  const { patrolsOverlapFilter, setPatrolFilterAllowsOverlap, isOpen, target, container } = props;

  const handleOptionChange = (e) => {
    setPatrolFilterAllowsOverlap(e.currentTarget.value === 'overlap_dates');
  };

  const handleKeyDown = useCallback((e) => {
    console.log('handleKeypress>>>>>>', e);
    e.stopPropagation();
    e.preventDefault();
    const { key } = e;
    if (key === 'Escape') {
      console.log('escape key');
    }
    e.preventDefault();
  }, [isOpen]);

  const handleOutsideClick = useCallback((e) => {
    console.log('handleClick>>>>>>', e);
    e.stopPropagation();
    e.preventDefault();
    if (container.current && (!container.current.contains(e.target))) {
      console.log('outside click');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, handleOutsideClick, isOpen]); 

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