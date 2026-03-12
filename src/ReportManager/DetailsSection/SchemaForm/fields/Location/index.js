import React, { memo, useEffect } from 'react';

import { JUMP_TO_LOCATION_BUTTON_ZOOM } from '../../constants';
import LocationPicker from '../../../../../LocationPicker';

import * as styles from './styles.module.scss';

const Location = ({
  blurLocationMarker,
  details,
  error,
  focusLocationMarker,
  id,
  onFieldChange,
  readOnly,
  value = null,
}) => {
  const hasError = !!error;

  // When closing a collection item form modal, the location fields get unmounted without triggering the blur event, so
  // we need to blur the location markers manually.
  useEffect(() => () => blurLocationMarker(), [blurLocationMarker]);

  return <div className={styles.text} data-testid={`schema-form-location-field-${id}`}>
    <label className={`${styles.label} ${hasError ? styles.error : ''}`} htmlFor={id}>
      {details.label}

      {details.isRequired && <span aria-hidden="true"> *</span>}
    </label>

    <LocationPicker
      id={id}
      inputProps={{
        'aria-describedby': `${id}-description`,
        'aria-errormessage': hasError ? `${id}-description` : undefined,
        'aria-invalid': hasError ? 'true' : 'false',
        'aria-required': details.isRequired,
      }}
      jumpToLocationButtonZoom={JUMP_TO_LOCATION_BUTTON_ZOOM}
      onBlur={() => blurLocationMarker()}
      onChange={(newLocation) => onFieldChange(id, newLocation || undefined)}
      onFocus={() => focusLocationMarker(id)}
      readOnly={readOnly}
      value={value}
    />

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>
  </div>;
};

export default memo(Location);
