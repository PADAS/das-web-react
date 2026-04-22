import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerFeedIcon } from '../../../../../../../../common/images/icons/marker-feed.svg';

import { FORM_ELEMENT_TYPES } from '../../../../../../../../utils/v2-event-schemas/constants';
import getHumanizedFieldValue from '../../../../../../../../utils/v2-event-schemas/getHumanizedFieldValue';
import { JUMP_TO_LOCATION_BUTTON_ZOOM } from '../../../../../constants';
import { selectCoordinatesRepresentation } from '../../../../../../../../selectors/location';
import useJumpToLocation from '../../../../../../../../hooks/useJumpToLocation';

import * as styles from './styles.module.scss';

const FormPreview = ({
  blurLocationMarker,
  errors,
  fieldIds,
  focusLocationMarker,
  formData,
  formElements,
  isDragOverlay,
}) => {
  const jumpToLocation = useJumpToLocation();
  const { t, i18n } = useTranslation('reports', {
    keyPrefix: 'reportManager.detailsSection.schemaForm.fields.collection.sortableList.item.formPreview',
  });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const hasError = !!errors;

  return <ul
      className={`${styles.formPreview} ${isDragOverlay ? styles.dragOverlay : ''} ${hasError ? styles.error : ''}`}
      data-testid="schema-form-collection-item-form-preview"
    >
    {fieldIds.map((fieldId) => {
      const fieldName = fieldId.split('.').pop();

      return <li className={styles.fieldSummary} key={fieldId}>
        <div>
          <p className={`${styles.label} ${errors?.[fieldName] ? styles.error : ''}`}>
            {formElements[fieldId].details.label}
          </p>

          <p className={`${styles.value} ${errors?.[fieldName] ? styles.error : ''}`}>
            {getHumanizedFieldValue(
              formElements[fieldId],
              formData[fieldName],
              '-',
              i18n.language,
              coordinatesRepresentation,
              t
            )}
          </p>
        </div>

        {formElements[fieldId].type === FORM_ELEMENT_TYPES.LOCATION && formData[fieldName] && <button
          aria-label={t('jumpToLocationButtonLabel', { field: formElements[fieldId].details.label })}
          className={`${styles.jumpToLocationButton} ${isDragOverlay ? styles.dragOverlay : ''}`}
          onBlur={() => isDragOverlay ? undefined : blurLocationMarker()}
          onClick={() => isDragOverlay ? undefined : jumpToLocation(
            [formData[fieldName].longitude, formData[fieldName].latitude],
            JUMP_TO_LOCATION_BUTTON_ZOOM
          )}
          onFocus={() => isDragOverlay ? undefined : focusLocationMarker(fieldName)}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
          title={t('jumpToLocationButtonLabel', { field: formElements[fieldId].details.label })}
          type="button"
        >
          <MarkerFeedIcon />
        </button>}
      </li>;
    })}
  </ul>;
};

export default FormPreview;
