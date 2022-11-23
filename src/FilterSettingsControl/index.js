import React, { forwardRef, memo, useCallback, useEffect } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import styles from './styles.module.scss';

// eslint-disable-next-line react/display-name
const FilterSettingsControl = forwardRef(({ isOpen, hideFilterSettings, target, container, children }, ref) => {
  const handleKeyDown = useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();

    if (event.key === 'Escape') {
      hideFilterSettings();
    }
  }, [hideFilterSettings]);

  const handleOutsideClick = useCallback((event) => {
    event.stopPropagation();
    event.preventDefault();

    if (container.current && (!container.current.contains(event.target))) {
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
        <Popover.Body ref={ref}>
          {children}
        </Popover.Body>
      </Popover>
    </Overlay>
  </div>;
});

FilterSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};

export default (memo(FilterSettingsControl));
