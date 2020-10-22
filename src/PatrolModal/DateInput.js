import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import setSeconds from 'date-fns/set_seconds';
import isFuture from 'date-fns/is_future';

import DateTimePickerPopover from '../DateTimePickerPopover';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import styles from './styles.module.scss';

const PatrolDateInput = (props) => {
  const { calcSubmitButtonTitle, children, title, value, onChange, className, ...rest } = props;

  const [stateTime, setStateTime] = useState(value);
  const [autoChecked, setAutoChecked] = useState(true);
  const [tempPopoverProps, setTempPopoverProps] = useState({});

  const onHide = useCallback(() => {
    setStateTime(value);
  }, [value]);

  const commitTimeChange = useCallback(() => {
    onChange(stateTime, autoChecked);

    setTempPopoverProps({ popoverOpen: false });
    setTimeout(() => setTempPopoverProps({}), 1000);
  }, [autoChecked, onChange, stateTime]);

  const onTimeChange = useCallback((val) => {
    setStateTime(
      !!val 
        ? setSeconds(new Date(val), 0)
        : null
    );
  }, []);

  const buttonTitle = useMemo(() =>
    calcSubmitButtonTitle(value, stateTime)
  , [calcSubmitButtonTitle, stateTime, value]);

  const timeBeingEdited = useMemo(() => new Date(stateTime).getTime() !== new Date(value).getTime(), [stateTime, value]);

  const timeClassName = useMemo(() => {
    let string = styles.timeInput;

    if (!value) {
      string += ` ${styles.empty }`;
    }

    if (timeBeingEdited) {
      string += ` ${styles.editingDate}`;
    }

    if (className) {
      string += ` ${className}`;
    }

    return string;
  }, [className, timeBeingEdited, value]);

  const canShowAutoCheck = useMemo(() =>
    Math.abs(differenceInMinutes(new Date(stateTime), new Date())) > 1
    && isFuture(new Date(stateTime)
    ), [stateTime]);

  useEffect(() => {
    setStateTime(value);
  }, [value]);

  return <div>
    <DateTimePickerPopover
      {...DATEPICKER_DEFAULT_CONFIG}
      value={stateTime} 
      className={timeClassName} 
      {...tempPopoverProps} 
      onHide={onHide} 
      onEnter={commitTimeChange}
      onChange={onTimeChange}
      {...rest}
    >  
      <div className={styles.dateTimePickerChildren}>
        <Button disabled={!timeBeingEdited} variant='primary' type='button' onClick={commitTimeChange}>
          {buttonTitle}
        </Button>
        {canShowAutoCheck && <label htmlFor='autoStart'>
          <input checked={autoChecked} disabled={!timeBeingEdited} onChange={() => setAutoChecked(!autoChecked)} type='checkbox' id='autoStart' /> Automatic
        </label>}
      </div>
    </DateTimePickerPopover>
  </div>;
};


// const ControlPopover = forwardRef((props, ref) => {  /* eslint-disable-line react/display-name */
//   const { placement, popoverClassName = '', ...rest } = props;
//   return <Popover ref={ref} className={`${styles.datePopover} ${popoverClassName}`} placement={placement || DEFAULT_PLACEMENT}>
//     <Popover.Content>
//       <p>now</p>
//       <DateTimePickerPopover {...rest} placeholder='----/--/-- --:--' />
//       <button type='button'>Start or schedule</button>
//       {!!props.value && <label htmlFor='autoStart'><input type='checkbox' id='autoStart' />Do this automatically</label>}
//       <ul>
//         <li><button type='button'>I am a shortcut</button></li>
//         <li><button type='button'>I am a shortcut</button></li>
//       </ul>
//     </Popover.Content>
//   </Popover>;
// });

// const PatrolDateInput = (props) => {
//   const { placement } = props;
  
//   const buttonRef = useRef(null);
//   const containerRef = useRef(null);
//   const [popoverOpen, togglePopoverState] = useState(false);

//   const hidePopover = useCallback(() => {
//     togglePopoverState(false);
//   }, []);

//   const optionalProps = useMemo(() => {
//     const value = {};
//     if (placement === 'auto') {
//       value.flip = true;
//     }
//     return value;
//   }, [placement]);

//   const displayValue = useMemo(() => {
//     return !!props.value ? format(props.value, DATEPICKER_DEFAULT_CONFIG.format) : props.placeholder; 
//   }, [props.value, props.placeholder]);

//   return <div ref={containerRef} style={{position: 'relative'}}>
//     <button className={!!displayValue ? styles.timeInput : `${styles.timeInput} ${styles.empty}`} type='button' ref={buttonRef} onClick={togglePopoverState}>{displayValue}</button>
//     <Overlay show={popoverOpen} placement={props.placement || DEFAULT_PLACEMENT} {...optionalProps} rootClose onHide={hidePopover} target={buttonRef.current} container={containerRef.current}>
//       <ControlPopover {...props}  />
//     </Overlay>
//   </div>;
  
// };

export default memo(PatrolDateInput);