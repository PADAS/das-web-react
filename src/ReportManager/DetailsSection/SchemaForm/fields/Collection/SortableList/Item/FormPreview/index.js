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
    {fieldIds.map((fieldId) => <li className={styles.fieldSummary} key={fieldId}>
      <div>
        <p className={`${styles.label} ${errors?.[fieldId] ? styles.error : ''}`}>
          {formElements[fieldId].details.label}
        </p>

        <p className={`${styles.value} ${errors?.[fieldId] ? styles.error : ''}`}>
          {getHumanizedFieldValue(
            formElements[fieldId],
            formData[fieldId],
            '-',
            i18n.language,
            coordinatesRepresentation,
            t
          )}
        </p>
      </div>

      {formElements[fieldId].type === FORM_ELEMENT_TYPES.LOCATION && formData[fieldId] && <button
        aria-label={t('jumpToLocationButtonLabel', { field: formElements[fieldId].details.label })}
        className={`${styles.jumpToLocationButton} ${isDragOverlay ? styles.dragOverlay : ''}`}
        onBlur={() => isDragOverlay ? undefined : blurLocationMarker()}
        onClick={() => isDragOverlay ? undefined : jumpToLocation(
          [formData[fieldId].longitude, formData[fieldId].latitude],
          JUMP_TO_LOCATION_BUTTON_ZOOM
        )}
        onFocus={() => isDragOverlay ? undefined : focusLocationMarker(fieldId)}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && event.stopPropagation()}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        <MarkerFeedIcon />
      </button>}
    </li>)}
  </ul>;
};

export default FormPreview;
