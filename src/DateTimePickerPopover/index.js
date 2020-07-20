import React, { forwardRef, memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import format from 'date-fns/format';
import debounce from 'lodash/debounce';
import InputMask from 'react-input-mask';
import setSeconds from 'date-fns/set_seconds';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import DateTimePicker from '../DateTimePicker';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';

import { dateIsValid } from '../utils/datetime';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import styles from './styles.module.scss';

const DEFAULT_PLACEMENT = 'bottom';
const BLANK_VALUE = '____-__-__ __:__';

const DateTimePickerPopover = (props, ref) => {
  const { popperConfig = {}, onPopoverToggle, minDate, maxDate, onChange, required, value, placement } = props;
  const popoverStateIsControlled = props.hasOwnProperty('popoverOpen');

  const [popoverOpen, setPopoverState] = useState(popoverStateIsControlled ? props.popoverOpen : false);
  const [inputValue, setInputValue] = useState('');
  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);
  const [isValid, setValidState] = useState(true);

  const canShowClearButton = useMemo(() => (
    inputValue !== BLANK_VALUE)
    && !required, 
  [inputValue, required],
  );

  const dateIsWithinTimeRange = useCallback((date) => {
    const dateAsMs = setSeconds(date, 0).getTime();
    let minCondition = true;
    let maxCondition = true;
    
    if (minDate) minCondition = (dateAsMs >= new Date(minDate).getTime());
    if (maxDate) maxCondition = (dateAsMs <= new Date(setSeconds(maxDate, 0)).getTime());

    return minCondition && maxCondition;

  }, [maxDate, minDate]);

  const onInputChange = useCallback(({ target: { value } }) => {
    setInputValue(value);
  }, []);

  const onInputBlur = useCallback(() => {
    if (!!lastKnownValidValue && onChange) {
      onChange(lastKnownValidValue);
    }
  }, [lastKnownValidValue, onChange]);

  const onInputClick = useCallback(debounce((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (popoverStateIsControlled) {
      onPopoverToggle(true);
    } else {
      setPopoverState(true);
    }
  }, 100), []);

  const hidePopover = useCallback((event) => {
    if (event && !containerRef.current.contains(event.target)) {
      popoverStateIsControlled ? onPopoverToggle(false) : setPopoverState(false);
    } else {
      popoverStateIsControlled ? onPopoverToggle(false) : setPopoverState(false);
    }
  }, [popoverStateIsControlled, onPopoverToggle]);

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

  const onClickClearIcon = useCallback(() => {
    !!onChange && onChange('');
  }, [onChange]);

  useEffect(() => {
    if (value && dateIsValid(value)) {
      const potentialVal = setSeconds(new Date(value), 0);

      if (potentialVal.getTime() !== new Date(inputValue).getTime()) {
        setInputValue(
          format(potentialVal, DATEPICKER_DEFAULT_CONFIG.format) 
        );
      }
    } else {
      setInputValue('');
    }
    

  }, [value]); /* eslint-disable-line */

  useEffect(() => {
    const handleChange = (newDate) => {
      if (new Date(newDate).getTime() !== new Date(value).getTime()) {
        !!onChange && onChange(newDate);
      }
    };

    const handleValidInput = (value) => {
      setValidState(true);
      setLastKnownValidValue(value);
    };

    if (!inputValue && !required) {
      handleValidInput('');
      return;
    }

    const newDate = new Date(inputValue.replace(/_/g, ''));
    
    if (
      (!dateIsValid(newDate))
      || !dateIsWithinTimeRange(newDate)
    ) {
      setValidState(false);
      return;
    }

    const isCompleteValue = (
      !!inputValue 
      && inputValue.split('_').length - 1 === 0
    );

    handleValidInput(newDate);

    if (isCompleteValue) {
      handleChange(newDate);
    }

  }, [inputValue]); /* eslint-disable-line */

  useEffect(() => {
    if (
      popoverStateIsControlled
      && (popoverOpen !== props.popoverOpen)
    ) {
      setPopoverState(props.popoverOpen);
    }
  }, [popoverStateIsControlled, popoverOpen, props.popoverOpen]);

  const optionalProps = useMemo(() => {
    const value = {};
    if (placement === 'auto') {
      value.flip = true;
    }
    return value;
  }, [placement]);

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={styles.container}>
    <InputMask type='text' value={inputValue} mask="9999-99-99 99:99" placeholder={BLANK_VALUE} onClick={onInputClick} onChange={onInputChange} onBlur={onInputBlur} ref={buttonRef} className={`${styles.input} ${!isValid ? styles.invalid : ''}`} />
    {canShowClearButton && <ClearIcon onClick={onClickClearIcon} className={styles.clearIcon} />}
    <Overlay popperConfig={popperConfig} show={popoverOpen} placement={placement || DEFAULT_PLACEMENT} {...optionalProps} rootClose onHide={hidePopover} target={buttonRef.current} container={containerRef.current}>
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