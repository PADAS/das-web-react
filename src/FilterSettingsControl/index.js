import React, { forwardRef, useCallback, useEffect, memo } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
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
  }, [hideFilterSettings]);

  const handleOutsideClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (container.current && (!container.current.contains(e.target))) {
      hideFilterSettings();
    }
  }, [container, hideFilterSettings]);

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

  return <div>
    <Overlay show={isOpen} target={target.current} container={container.current} placement='bottom' >
      <Popover id="patrol-filter-settings" className={styles.popover}>
        <Popover.Content ref={ref}>
          {children} 
        </Popover.Content>
      </Popover>
    </Overlay>
  </div>;
});


export default (memo(FilterSettingsControl));

FilterSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};