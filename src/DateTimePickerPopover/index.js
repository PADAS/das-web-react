import React, { forwardRef, memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import format from 'date-fns/format';
import debounce from 'lodash/debounce';

import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import DateTimePicker from '../DateTimePicker';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import styles from './styles.module.scss';

const DEFAULT_PLACEMENT = 'bottom';

const DateTimePickerPopover = (props, ref) => {
  const { popperConfig = {}, onPopoverToggle } = props;
  const isControlledComponent = props.hasOwnProperty('popoverOpen');

  const [popoverOpen, setPopoverState] = useState(isControlledComponent ? props.popoverOpen : false);
  const [buttonValue, setButtonValue] = useState('');

  // const isValid = useMemo(() => , []);
  
  const onClick = useCallback(debounce((e) => {
    if (isControlledComponent) {
      onPopoverToggle(true);
    } else {
      setPopoverState(true);
    }
  }, 100), []);

  const hidePopover = useCallback((event) => {
    if (event) {
      if (!containerRef.current.contains(event.target)) {
        isControlledComponent ? onPopoverToggle(false) : setPopoverState(false);
      };
    } else {
      isControlledComponent ? onPopoverToggle(false) : setPopoverState(false);
    }
  }, [isControlledComponent, onPopoverToggle]);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    const closingKeys = ['Escape', 'Enter'];

    if (closingKeys.includes(key) && popoverOpen) {
      event.preventDefault();
      event.stopPropagation();
      hidePopover();
    }
  }, [hidePopover, popoverOpen]);

  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setButtonValue(
      props.value ? 
        format(new Date(props.value), DATEPICKER_DEFAULT_CONFIG.format) 
        : ''
    );

  }, [props.value]);

  useEffect(() => {
    if (isControlledComponent && popoverOpen !== props.popoverOpen) {
      setPopoverState(props.popoverOpen);
    }
  }, [isControlledComponent, popoverOpen, props.popoverOpen]);

  const optionalProps = useMemo(() => {
    const value = {};
    if (props.placement === 'auto') {
      value.flip = true;
    }
    return value;
  }, [props.placement]);

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={styles.container}>
    <button type='button' onClick={onClick} ref={buttonRef} className={styles.button}>{buttonValue}</button>
    <Overlay popperConfig={popperConfig} show={popoverOpen} placement={props.placement || DEFAULT_PLACEMENT} {...optionalProps} rootClose onHide={hidePopover} target={buttonRef.current} container={containerRef.current}>
      <DateTimePopover {...props}  />
    </Overlay>
  </div>;
  
};

const DateTimePopover = forwardRef((props, ref) => {  /* eslint-disable-line react/display-name */
  const { placement, popoverStyles = {}, popoverClassName } = props;
  return <Popover ref={ref} className={`${styles.popover} ${popoverClassName}`} style={popoverStyles} placement={placement || DEFAULT_PLACEMENT}>
    <Popover.Content>
      <DateTimePicker {...props} />
    </Popover.Content>
  </Popover>;
});

export default memo(forwardRef(DateTimePickerPopover));