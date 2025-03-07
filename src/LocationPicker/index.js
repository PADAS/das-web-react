import React, { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';

import { calcGpsDisplayString } from '../utils/location';
import useJumpToLocation from '../hooks/useJumpToLocation';

import MenuPopover from './MenuPopover';
import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const LocationPicker = ({
  className = '',
  disabled = false,
  id,
  inputProps = {},
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  placeholder = null,
  readOnly = false,
  required = false,
  value,
  ...otherProps
}, ref) => {
  const jumpToLocation = useJumpToLocation();
  const { t } = useTranslation('components', { keyPrefix: 'locationPicker' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const innerRef = useRef();
  const setLocationButtonRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);

  const displayValue = value ? calcGpsDisplayString(value.latitude, value.longitude, gpsFormat) : '';

  return <>
    <div
        className={`${styles.locationPicker} ${disabled ? styles.disabled : ''} ${inputProps['aria-invalid'] ? styles.error : ''} ${className}`}
        id={`${id}-wrapper`}
        // Since our picker is a group of buttons, we handle the blur and focus from the wrapper but make sure to not
        // call the methods if we are just changing focus within the inner buttons.
        onBlur={(event) => !innerRef.current.contains(event.relatedTarget) && onBlur?.(event)}
        onFocus={(event) => !innerRef.current.contains(event.relatedTarget) && onFocus?.(event)}
        ref={innerRef}
        role="group"
        {...otherProps}
      >
      <button
        aria-controls={`${id}-menuPopover`}
        aria-expanded={isMenuPopoverOpen}
        aria-label={t(`setLocationButtonLabel.${isMenuPopoverOpen ? 'open' : 'closed'}`)}
        className={`${styles.setLocationButton} ${readOnly ? styles.readOnly : ''}`}
        disabled={disabled || readOnly}
        onClick={() => setIsMenuPopoverOpen(!isMenuPopoverOpen)}
        ref={setLocationButtonRef}
        title={t(`setLocationButtonLabel.${isMenuPopoverOpen ? 'open' : 'closed'}`)}
        type="button"
      >
        <input
          aria-describedby={`${id}-inputDescription`}
          aria-label={t('inputLabel')}
          className={`${styles.input} ${readOnly ? styles.readOnly : ''}`}
          disabled={disabled}
          id={id}
          placeholder={placeholder || t('defaultPlaceholder')}
          readOnly
          required={required}
          tabIndex={-1}
          type="text"
          value={displayValue}
          {...inputProps}
        />

        <p className={styles.inputDescription} id={`${id}-inputDescription`}>
          {t('inputDescription')}
        </p>
      </button>

      {value && <TextCopyBtn
        aria-label={t('textCopyButtonLabel')}
        className={styles.textCopyButton}
        disabled={disabled}
        text={displayValue}
        title={t('textCopyButtonLabel')}
      />}

      <button
        aria-label={t('jumpToLocationButtonLabel')}
        className={styles.jumpToLocationButton}
        disabled={!value || disabled}
        onClick={() => jumpToLocation([value.longitude, value.latitude])}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        <MarkerFeedIcon />
      </button>

      <input data-testid="locationPicker-input" name={name} type="hidden" value={value} />
    </div>

    <Overlay
      container={innerRef}
      onHide={() => setIsMenuPopoverOpen(false)}
      placement="bottom-start"
      rootClose
      show={isMenuPopoverOpen}
      target={innerRef}
      >
      <MenuPopover
        id={id}
        onChange={onChange}
        onClose={() => setIsMenuPopoverOpen(false)}
        setLocationButtonRef={setLocationButtonRef}
        target={innerRef}
        value={value}
      />
    </Overlay>
  </>;
};

export default memo(forwardRef(LocationPicker));
