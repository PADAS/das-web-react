import React, { forwardRef, useCallback, useEffect, memo } from 'react';
import { connect } from 'react-redux';
import { Overlay, Popover } from 'react-bootstrap';
import styles from './styles.module.scss';
import { setPatrolFilterAllowsOverlap } from '../ducks/patrol-filter';

const FilterSettingsControl = forwardRef((props, ref) => {
  const { isOpen, hideFilterSettings, target, container, children } = props;

  const handleKeyDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const { key } = e;
    if (key === 'Escape') {
      hideFilterSettings();
    }
    e.preventDefault();
  }, [isOpen]);

  const handleOutsideClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (container.current && (!container.current.contains(e.target))) {
      hideFilterSettings();
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
        {children} 
      </Popover.Content>
    </Popover>
  </Overlay>
  </div>;
});

const mapStateToProps = ({ data: { patrolsOverlapFilter } }) => {
  return {patrolsOverlapFilter};
};

export default connect(mapStateToProps, {setPatrolFilterAllowsOverlap})(memo(FilterSettingsControl));

FilterSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};