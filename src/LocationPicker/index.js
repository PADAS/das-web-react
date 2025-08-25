import React, { memo, useId, useImperativeHandle, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';

import { selectCoordinatesRepresentation } from '../selectors/location';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useStringifyCoordinates from '../hooks/useStringifyCoordinates';

import IconTooltip from '../IconTooltip';
import MenuPopover from './MenuPopover';
import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const LocationPicker = ({
  className = '',
  disabled = false,
  id,
  inputProps = {},
  jumpToLocationButtonZoom = undefined,
  name = '',
  onBlur = null,
  onChange,
  onFocus = null,
  placeholder = null,
  readOnly = false,
  ref,
  required = false,
  value,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'locationPicker' });

  const jumpToLocation = useJumpToLocation();

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const innerRef = useRef();
  const setLocationButtonRef = useRef();

  useImperativeHandle(ref, () => innerRef.current);

  const inputDescriptionId = useId();
  const menuPopoverId = useId();
  const valueOutsideBboxTooltipId = useId();

  const [isMenuPopoverOpen, setIsMenuPopoverOpen] = useState(false);

  const {
    coordinatesString: valueCoordinatesString,
    outsideRepresentationBbox: valueOutsideRepresentationBbox,
  } = useStringifyCoordinates(value);

  return <>
    <div
        className={`${styles.locationPicker} ${disabled ? styles.disabled : ''} ${inputProps['aria-invalid'] ? styles.error : ''} ${className}`}
        // Since our picker is a group of buttons, we handle the blur and focus from the wrapper but make sure to not
        // call the methods if we are just changing focus within the inner buttons.
        onBlur={(event) => !innerRef.current.contains(event.relatedTarget) && onBlur?.(event)}
        onFocus={(event) => !innerRef.current.contains(event.relatedTarget) && onFocus?.(event)}
        ref={innerRef}
        role="group"
        {...otherProps}
      >
      <button
        aria-controls={menuPopoverId}
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
          aria-describedby={`${inputDescriptionId} ${valueOutsideBboxTooltipId}`}
          aria-label={t('inputLabel')}
          className={`${styles.input} ${readOnly ? styles.readOnly : ''}`}
          disabled={disabled}
          id={id}
          onFocus={() => setLocationButtonRef.current.focus()}
          placeholder={placeholder || t('defaultPlaceholder')}
          readOnly
          required={required}
          tabIndex={-1}
          type="text"
          value={valueCoordinatesString}
          {...inputProps}
        />

        <p className={styles.inputDescription} id={inputDescriptionId}>
          {t('inputDescription')}
        </p>
      </button>

      {valueOutsideRepresentationBbox && <IconTooltip
        aria-label={t('valueOutsideBboxTooltipButtonLabel')}
        className={styles.valueOutsideBboxTooltip}
        data-testid="locationPicker-valueOutsideBboxTooltip"
        id={valueOutsideBboxTooltipId}
        title={t('valueOutsideBboxTooltipTitle', {
          crsName: coordinatesRepresentation.name,
          epsgCode: coordinatesRepresentation.code,
        })}
      />}

      {value && <TextCopyBtn
        aria-label={t('textCopyButtonLabel')}
        className={styles.textCopyButton}
        disabled={disabled}
        text={valueCoordinatesString}
        title={t('textCopyButtonLabel')}
      />}

      <button
        aria-label={t('jumpToLocationButtonLabel')}
        className={styles.jumpToLocationButton}
        disabled={!value || disabled}
        onClick={() => jumpToLocation([value.longitude, value.latitude], jumpToLocationButtonZoom)}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        <MarkerFeedIcon />
      </button>

      <input
        data-testid="locationPicker-input"
        name={name}
        type="hidden"
        value={value ? `${value.latitude},${value.longitude}` : ''}
      />
    </div>

    <Overlay container={innerRef} placement="bottom-start" show={isMenuPopoverOpen} target={innerRef}>
      <MenuPopover
        id={menuPopoverId}
        onChange={onChange}
        onBlur={onBlur}
        onClose={() => setIsMenuPopoverOpen(false)}
        setLocationButtonRef={setLocationButtonRef}
        target={innerRef}
        value={value}
      />
    </Overlay>
  </>;
};

export default memo(LocationPicker);
