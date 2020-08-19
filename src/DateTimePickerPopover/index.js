import React, { forwardRef, memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import debounceRender from 'react-debounce-render';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import debounce from 'lodash/debounce';
import InputMask from 'react-input-mask';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import setSeconds from 'date-fns/set_seconds';

import DateTimePicker from '../DateTimePicker';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import { dateIsValid, timeValuesAreEqualToTheMinute } from '../utils/datetime';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import styles from './styles.module.scss';

const DEFAULT_PLACEMENT = 'bottom';
const BLANK_VALUE = '____-__-__ __:__';

const DateTimePickerPopover = (props, ref) => {
  const { className = '', popperConfig = {}, inputClassName = '', placeholder = '', onPopoverToggle, minDate, maxDate, onChange, required, value, placement, showClockIcon = false } = props;
  const popoverStateIsControlled = props.hasOwnProperty('popoverOpen');

  const [popoverOpen, setPopoverState] = useState(popoverStateIsControlled ? props.popoverOpen : false);
  const [inputValue, setInputValue] = useState('');
  const [lastKnownValidValue, setLastKnownValidValue] = useState(null);
  const [isValid, setValidState] = useState(true);

  const canShowClearButton = useMemo(() => (
    inputValue !== BLANK_VALUE)
    && (!!inputValue)
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
      if (!timeValuesAreEqualToTheMinute(value, inputValue)) {
        setInputValue(
          format(value, DATEPICKER_DEFAULT_CONFIG.format) 
        );
      }
    } else {
      setInputValue('');
    }
    

  }, [value]); /* eslint-disable-line */

  useEffect(() => {
    const handleChange = (newDate) => {
      if (!timeValuesAreEqualToTheMinute(newDate, value)) {
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

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={`${styles.container} ${!!inputValue ? '' : 'empty'} ${className}`}>
    {showClockIcon && <ClockIcon className={styles.clockIcon} />}
    <InputMask type='text' value={inputValue} mask="9999-99-99 99:99" placeholder={placeholder || BLANK_VALUE} onClick={onInputClick} onChange={onInputChange} onBlur={onInputBlur} ref={buttonRef} className={`${styles.input} ${!isValid ? styles.invalid : ''} ${inputClassName}`} />
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

export default debounceRender(memo(forwardRef(DateTimePickerPopover)), 60);

DateTimePickerPopover.propTypes = {
  popperConfig: PropTypes.object,
  onPopoverToggle: PropTypes.func,
  minDate: PropTypes.oneOf([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]),
  maxDate:  PropTypes.oneOf([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.oneOf([PropTypes.instanceOf(Date), PropTypes.oneOf([null])]).isRequired,
  placement: PropTypes.string,
  inputClassName: PropTypes.string,
  placeholder: PropTypes.string,
  showClockIcon: PropTypes.bool,
};