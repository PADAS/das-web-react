import React, { forwardRef, memo, useCallback , useMemo, useRef, useState } from 'react';
import format from 'date-fns/format';
import parse from 'date-fns/parse';

import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import DateTimePicker from '../DateTimePicker/index2.js';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import styles from './styles.module.scss';

const PLACEHOLDER = '----/--/-- --:--';

const DateTimePickerPopover = (props) => {
  const [popoverOpen, setPopoverState] = useState(false);

  const onBlur = useCallback(() => setPopoverState(false), []);
  const onFocus = useCallback(() => setPopoverState(true), []);

  const onDateInputChange = useCallback(({ target: { value } }) => {
    console.log('value', value);
    console.log('parsed', parse(value));
  }, []);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    const closingKeys = ['Escape', 'Enter'];

    if (closingKeys.includes(key) && popoverOpen) {
      event.preventDefault();
      event.stopPropagation();
      setPopoverState(false);
    }
  }, [popoverOpen]);

  const targetRef = useRef(null);
  const containerRef = useRef(null);

  const displayString = useMemo(() => {
    if (!props.value) return props.label || PLACEHOLDER;

    return format(new Date(props.value), DATEPICKER_DEFAULT_CONFIG.format);
  }, [props.label, props.value]);

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={styles.container}>
    <input className={styles.input} type='text' placeholder={PLACEHOLDER} className={styles.button} onFocus={onFocus} onBlur={onBlur} onChange={onDateInputChange} value={displayString} ref={targetRef} />
    <Overlay show={popoverOpen} placement={props.placement || 'bottom'} rootClose onHide={() => setPopoverState(false)}  target={targetRef.current} container={containerRef.current}>
      <DateTimePopover {...props}  />
    </Overlay>
  </div>;
  
};

const DateTimePopover = forwardRef((props, ref) => {  /* eslint-disable-line react/display-name */
  return <Popover ref={ref} className={`${styles.popover} ${props.popoverClassName}`} placement={props.placement || 'auto'}>
    <Popover.Content>
      <DateTimePicker {...props} />
    </Popover.Content>
  </Popover>;
});

export default memo(DateTimePickerPopover);