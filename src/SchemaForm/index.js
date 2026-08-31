import React, { useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { merge } from 'lodash-es';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { clearUserContent } from '../ducks/user-content';
import evaluateSectionConditions from './utils/evaluateSectionConditions';
import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../utils/form-schemas/constants';
import { FormInstanceContext } from './utils/useFormElementDomId';
import getDefaultFormData from './utils/getDefaultFormData';
import normalizeChoiceListValues from '../utils/form-schemas/normalizeChoiceListValues';
import normalizeDateTimeFieldValue from './utils/normalizeDateTimeFieldValue';
import transformSchemaToFormElements from '../utils/form-schemas/transformSchemaToFormElements';
import useMapLocationMarkers from './utils/useMapLocationMarkers';
import useSchemaValidations from './utils/useSchemaValidations';
import useUploadValidations from './utils/useUploadValidations';

import Attachment from './formElements/Attachment';
import Boolean from './formElements/Boolean';
import ChoiceList from './formElements/ChoiceList';
import Collection from './formElements/Collection';
import DateTime from './formElements/DateTime';
import Header from './formElements/Header';
import Location from './formElements/Location';
import Numeric from './formElements/Numeric';
import Section from './formElements/Section';
import Text from './formElements/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.BOOLEAN]: Boolean,
  [FORM_ELEMENT_TYPES.CHOICE_LIST]: ChoiceList,
  [FORM_ELEMENT_TYPES.DATE_TIME]: DateTime,
  [FORM_ELEMENT_TYPES.NUMERIC]: Numeric,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
};

const getVisibleSectionIds = (formElements, formData) =>
  formElements[ROOT_CANVAS_ID]?.details.sections
    .filter((sectionId) => evaluateSectionConditions(
      formElements[sectionId].details.conditions,
      formElements[sectionId].details.conditionsLogicalOperator,
      formData,
    ));

const SchemaForm = ({
  anchorLocation,
  as = 'form',
  className = '',
  formData,
  hideMapLocationMarkers,
  metadata,
  onFormDataChange,
  onFormSubmit = null,
  readOnly,
  renderSubmitButton = () => null,
  schema,
  shouldPopulateDefaultData,
  validateRef,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('schema-form');

  const formInstanceId = useId();

  const isFormOwner = as === 'form';

  const getDomId = useCallback(
    (formElementId) => formInstanceId ? `${formInstanceId}-${formElementId}` : formElementId,
    [formInstanceId]
  );

  const onLocationMarkerClick = useCallback((markerId) => {
    const locationField = document.getElementById(getDomId(markerId));
    if (locationField) {
      // The location field is in the document, focus it.
      locationField.focus();
    } else {
      // The location field is not in the document, it must be contained by a
      // collection item. Calculate the collection item id to focus it.
      const markerIdPathParts = markerId.split('.');
      const collectionItemId = `${markerIdPathParts[0]}`;
      document.getElementById(getDomId(collectionItemId))?.focus();
    }
  }, [getDomId]);

  const {
    blurLocationMarker,
    focusLocationMarker,
    setLocationMarkers,
  } = useMapLocationMarkers(anchorLocation, onLocationMarkerClick, hideMapLocationMarkers);

  const [fieldErrors, setFieldErrors] = useState({});
  const [lastSubmissionErroneousFields, setLastSubmissionErroneousFields] = useState([]);
  const [shouldCalculateInitialData, setShouldCalculateInitialData] = useState(true);

  const formElements = useMemo(() => transformSchemaToFormElements(schema), [schema]);

  const normalizedFormData = useMemo(() => normalizeChoiceListValues(formData, formElements), [formData, formElements]);

  const runSchemaValidations = useSchemaValidations(schema);
  const runUploadValidations = useUploadValidations(formElements);

  const validate = ({ shouldFocusFirstError = true } = {}) => {
    const schemaErrors = runSchemaValidations(normalizedFormData) || {};
    const uploadErrors = runUploadValidations(normalizedFormData);
    const fieldErrors = merge({}, schemaErrors, uploadErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const erroneousFields = Object.keys(fieldErrors);

      setFieldErrors(fieldErrors);
      setLastSubmissionErroneousFields(erroneousFields);

      if (shouldFocusFirstError) {
        document.getElementById(getDomId(erroneousFields[0]))?.focus();
      }

      return false;
    }

    setFieldErrors({});
    setLastSubmissionErroneousFields([]);

    return true;
  };

  useImperativeHandle(validateRef, () => ({ validate }));

  const visibleSectionIds = useMemo(
    () => getVisibleSectionIds(formElements, normalizedFormData),
    [formElements, normalizedFormData]
  );

  const onSubmit = (event) => {
    event.preventDefault();

    if (validate()) {
      onFormSubmit();
    }
  };

  const onSectionFieldChange = (fieldId, value) => {
    // Section children's ids and names are the same.
    const fieldName = formElements[fieldId].details.value;
    const newFormData = { ...normalizedFormData, [fieldName]: value };

    // Conditional sections can depend on fields in other conditional sections.
    // Remove hidden fields from the form data in a loop until all sections
    // that will be hidden are iterated.
    let previousVisibleSectionIds = visibleSectionIds;
    while (true) {
      const currentVisibleSectionIds = getVisibleSectionIds(formElements, newFormData);
      const currentHiddenSectionIds = previousVisibleSectionIds.filter(
        (sectionId) => !currentVisibleSectionIds.includes(sectionId)
      );
      const currentHiddenFieldsWithFormData = currentHiddenSectionIds.flatMap((sectionId) => [
        ...formElements[sectionId].details.leftColumn,
        ...formElements[sectionId].details.rightColumn,
      ]).filter((sectionChildId) => sectionChildId in newFormData);
      if (currentHiddenFieldsWithFormData.length > 0) {
        // There are fields to hide in the current iteration. Remove them from
        // the form data.
        currentHiddenFieldsWithFormData.forEach((fieldName) => delete newFormData[fieldName]);

        previousVisibleSectionIds = currentVisibleSectionIds;
      } else {
        // There are no more fields to hide. The form data is stable.
        break;
      }
    }

    onFormDataChange(newFormData);
  };

  // This method is designed to render form elements inside sections and collections.
  const renderFormElement = (id, value, onChange, error, focusLocationMarker, breadcrumbs = []) => {
    switch (formElements[id].type) {
    case FORM_ELEMENT_TYPES.ATTACHMENT:
      return <Attachment
        attachmentsMetadata={metadata?.attachments}
        details={formElements[id].details}
        error={error}
        formElementId={id}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        value={value}
      />;

    case FORM_ELEMENT_TYPES.HEADER:
      return <Header details={formElements[id].details} formElementId={id} key={id} />;

    case FORM_ELEMENT_TYPES.COLLECTION:
      return <Collection
        blurLocationMarker={blurLocationMarker}
        breadcrumbs={breadcrumbs}
        details={formElements[id].details}
        error={error}
        focusLocationMarker={focusLocationMarker}
        formElementId={id}
        formElements={formElements}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        renderFormElement={renderFormElement}
        value={value}
      />;

    case FORM_ELEMENT_TYPES.DATE_TIME:
      return <DateTime
        details={formElements[id].details}
        error={error}
        formElementId={id}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        value={normalizeDateTimeFieldValue(
          value,
          formElements[id].details.inputType
        )}
      />;

    case FORM_ELEMENT_TYPES.LOCATION:
      return <Location
        blurLocationMarker={blurLocationMarker}
        details={formElements[id].details}
        error={error}
        focusLocationMarker={focusLocationMarker}
        formElementId={id}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        value={value}
      />;

    default: {
      const Field = FIELDS[formElements[id].type];
      return <Field
        details={formElements[id].details}
        error={error}
        formElementId={id}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        value={value}
      />;
    }
    }
  };

  useEffect(() => {
    // Calculate the initial form data (default input values).
    if (shouldCalculateInitialData) {
      if (shouldPopulateDefaultData) {
        const visibleFieldIds = visibleSectionIds.flatMap((sectionId) => [
          ...formElements[sectionId].details.leftColumn,
          ...formElements[sectionId].details.rightColumn,
        ]);
        const initialData = getDefaultFormData(visibleFieldIds, formElements);

        if (!isEqual(initialData, normalizedFormData)) {
          onFormDataChange(initialData);
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldCalculateInitialData(false);
    }
  }, [formElements, normalizedFormData, onFormDataChange, shouldPopulateDefaultData, shouldCalculateInitialData, visibleSectionIds]);

  useEffect(() => {
    // Update the location markers when there is a change in the form data.
    const locationMarkers = {};
    const addLocationMarkersFromFormDataRecursively = (formData, parentCollectionFieldId = null, parentPath = '') => {
      Object.entries(formData).forEach(([fieldName, fieldValue]) => {
        const fieldId = parentCollectionFieldId ? `${parentCollectionFieldId}.${fieldName}` : fieldName;

        if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.LOCATION && fieldValue) {
          // The field is a location with a value, add it to the location
          // markers.
          locationMarkers[`${parentPath}${fieldName}`] = fieldValue;
        } else if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.COLLECTION) {
          // The field is a collection, add the location markers for each of
          // its items recursively prefixing them with the collection path to
          // differentiate the same field names in different collection items.
          fieldValue.forEach((itemFormData, index) => addLocationMarkersFromFormDataRecursively(
            itemFormData,
            fieldId,
            `${parentPath}${fieldName}[${index}].`
          ));
        }
      });
    };

    addLocationMarkersFromFormDataRecursively(normalizedFormData);

    setLocationMarkers(locationMarkers);
  }, [formElements, normalizedFormData, setLocationMarkers]);

  useEffect(() => {
    // The user content is shared across forms, so only the one that owns the
    // form element clears it.
    if (isFormOwner) {
      return () => dispatch(clearUserContent());
    }
  }, [dispatch, isFormOwner]);

  const formContent = <>
    <div className="sr-only" role="alert">
      {lastSubmissionErroneousFields.length > 0 && <>
        <p>{t('validationErrorsAnnouncement')}</p>

        <ul>
          {lastSubmissionErroneousFields.map((fieldId) => <li key={fieldId}>
            {formElements[fieldId].details.label}
          </li>)}
        </ul>
      </>}
    </div>

    {formElements[ROOT_CANVAS_ID]?.details.sections.map((sectionId) => <Section
      details={formElements[sectionId].details}
      fieldErrors={fieldErrors}
      focusLocationMarker={focusLocationMarker}
      formData={normalizedFormData}
      formElementId={sectionId}
      formElements={formElements}
      hidden={!visibleSectionIds.includes(sectionId)}
      key={sectionId}
      onFieldChange={onSectionFieldChange}
      onFieldErrorsChange={(newFieldErrors) => setFieldErrors(newFieldErrors)}
      renderFormElement={renderFormElement}
      setDefaultFormData={(defaultFormData) => onFormDataChange({ ...defaultFormData, ...normalizedFormData })}
    />)}
  </>;

  return <FormInstanceContext.Provider value={formInstanceId}>
    {isFormOwner
      ? <form className={className} onSubmit={onSubmit}>
        {formContent}

        {renderSubmitButton()}
      </form>
      : <div className={className}>{formContent}</div>}
  </FormInstanceContext.Provider>;
};

export default SchemaForm;
