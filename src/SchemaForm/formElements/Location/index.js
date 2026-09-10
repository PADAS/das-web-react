import React, { memo, useEffect } from 'react';

import { JUMP_TO_LOCATION_BUTTON_ZOOM } from '../../utils/constants';
import useFormElementDomId from '../../utils/useFormElementDomId';

import LocationPicker from '../../../LocationPicker';

import * as styles from './styles.module.scss';

const Location = ({
  blurLocationMarker,
  details,
  error,
  focusLocationMarker,
  formElementId,
  onFieldChange,
  readOnly,
  value = null,
}) => {
  const domId = useFormElementDomId(formElementId);

  const hasError = !!error;

  // When closing a collection item form modal, the location fields get unmounted without triggering the blur event, so
  // we need to blur the location markers manually.
  useEffect(() => () => blurLocationMarker(), [blurLocationMarker]);

  return <div className={styles.text} data-testid={`schema-form-location-field-${formElementId}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={domId}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <LocationPicker
      id={domId}
      inputProps={{
        'aria-describedby': `${domId}-description`,
        'aria-errormessage': hasError ? `${domId}-description` : undefined,
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-label': details.label,
        'aria-required': details.isRequired,
      }}
      jumpToLocationButtonZoom={JUMP_TO_LOCATION_BUTTON_ZOOM}
      onBlur={() => blurLocationMarker()}
      onChange={(newLocation) => onFieldChange(formElementId, newLocation || undefined)}
      onFocus={() => focusLocationMarker(details.value)}
      readOnly={readOnly}
      value={value}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${domId}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Location);
