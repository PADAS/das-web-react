import React, { memo, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as TriangleExclamationIcon } from '../common/images/icons/triangle-exclamation.svg';
import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';

import { OUTSIDE_BBOX, stringifyCoordinates } from '../utils/location';
import { selectCoordinatesRepresentation } from '../selectors/location';
import useJumpToLocation from '../hooks/useJumpToLocation';

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

  const { isValueOutsideCrsBbox, displayValue } = useMemo(() => {
    if (value) {
      // Calculate the display value in the coordinates representation and if
      // it falls outside the BBOX of the CRS, fallback to degrees.
      const displayValue = stringifyCoordinates(value, coordinatesRepresentation);
      if (displayValue === OUTSIDE_BBOX) {
        return { displayValue: stringifyCoordinates(value), isValueOutsideCrsBbox: true };
      }
      return { displayValue, isValueOutsideCrsBbox: false };
    }

    return { displayValue: '', isValueOutsideCrsBbox: false };
  }, [coordinatesRepresentation, value]);

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
          aria-describedby={`${inputDescriptionId}${isValueOutsideCrsBbox ? ` ${valueOutsideBboxTooltipId}`: ''}`}
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
          value={displayValue}
          {...inputProps}
        />

        <p className={styles.inputDescription} id={inputDescriptionId}>
          {t('inputDescription')}
        </p>
      </button>

      {isValueOutsideCrsBbox && <>
        <OverlayTrigger
          overlay={(props) => <Tooltip {...props} arrowProps={{ style: { display: 'none' } }}>
            {t('valueOutsideBboxTooltip', {
              crsName: coordinatesRepresentation.name,
              epsgCode: coordinatesRepresentation.code,
            })}
          </Tooltip>}
          placement="bottom"
        >
          <button
            aria-hidden
            aria-label={t('valueOutsideBboxTooltipButtonLabel')}
            className={styles.valueOutsideBboxTooltipButton}
            data-testid="locationPicker-valueOutsideBboxTooltipButton"
            type="button"
          >
            <TriangleExclamationIcon />
          </button>
        </OverlayTrigger>

        <p className="sr-only" id={valueOutsideBboxTooltipId}>
          {t('valueOutsideBboxTooltip', {
            crsName: coordinatesRepresentation.name,
            epsgCode: coordinatesRepresentation.code,
          })}
        </p>
      </>}

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
