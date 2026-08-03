import React, { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { merge } from 'lodash-es';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { clearUserContent } from '../ducks/user-content';
import evaluateSectionConditions from './utils/evaluateSectionConditions';
import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../utils/form-schemas/constants';
import getDefaultFormData from './utils/getDefaultFormData';
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
  formData,
  hideMapLocationMarkers,
  metadata,
  onFormDataChange,
  onFormSubmit,
  readOnly,
  renderSubmitButton,
  schema,
  shouldPopulateDefaultData,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('schema-form');

  const onLocationMarkerClick = useCallback((markerId) => {
    const locationField = document.getElementById(markerId);
    if (locationField) {
      // The location field is in the document, focus it.
      locationField.focus();
    } else {
      // The location field is not in the document, it must be contained by a
      // collection item. Calculate the collection item id to focus it.
      const markerIdPathParts = markerId.split('.');
      const collectionItemId = `${markerIdPathParts[0]}`;
      document.getElementById(collectionItemId)?.focus();
    }
  }, []);

  const {
    blurLocationMarker,
    focusLocationMarker,
    setLocationMarkers,
  } = useMapLocationMarkers(anchorLocation, onLocationMarkerClick, hideMapLocationMarkers);

  const [fieldErrors, setFieldErrors] = useState({});
  const [lastSubmissionErroneousFields, setLastSubmissionErroneousFields] = useState([]);
  const [shouldCalculateInitialData, setShouldCalculateInitialData] = useState(true);

  const formElements = useMemo(() => transformSchemaToFormElements(schema), [schema]);

  const runSchemaValidations = useSchemaValidations(schema);
  const runUploadValidations = useUploadValidations(formElements);

  const visibleSectionIds = useMemo(
    () => getVisibleSectionIds(formElements, formData),
    [formData, formElements]
  );

  const onSubmit = (event) => {
    event.preventDefault();

    const schemaErrors = runSchemaValidations(formData) || {};
    const uploadErrors = runUploadValidations(formData);
    const fieldErrors = merge({}, schemaErrors, uploadErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const erroneousFields = Object.keys(fieldErrors);

      setFieldErrors(fieldErrors);
      setLastSubmissionErroneousFields(erroneousFields);

      // Focus the first erroneous field if possible (it may be inside a
      // collection).
      document.getElementById(erroneousFields[0])?.focus();
    } else {
      setFieldErrors({});
      setLastSubmissionErroneousFields([]);

      onFormSubmit();
    }
  };

  const onSectionFieldChange = (fieldId, value) => {
    // Section children's ids and names are the same.
    const fieldName = formElements[fieldId].details.value;
    const newFormData = { ...formData, [fieldName]: value };

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
        id={id}
        key={id}
        onFieldChange={onChange}
        readOnly={readOnly}
        value={value}
      />;

    case FORM_ELEMENT_TYPES.HEADER:
      return <Header details={formElements[id].details} id={id} key={id} />;

    case FORM_ELEMENT_TYPES.COLLECTION:
      return <Collection
        blurLocationMarker={blurLocationMarker}
        breadcrumbs={breadcrumbs}
        details={formElements[id].details}
        error={error}
        focusLocationMarker={focusLocationMarker}
        formElements={formElements}
        id={id}
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
        id={id}
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
        id={id}
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
        id={id}
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

        if (!isEqual(initialData, formData)) {
          onFormDataChange(initialData);
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldCalculateInitialData(false);
    }
  }, [formData, formElements, onFormDataChange, shouldPopulateDefaultData, shouldCalculateInitialData, visibleSectionIds]);

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

    addLocationMarkersFromFormDataRecursively(formData);

    setLocationMarkers(locationMarkers);
  }, [formData, formElements, setLocationMarkers]);

  useEffect(() => () => dispatch(clearUserContent()), [dispatch]);

  return <form onSubmit={onSubmit}>
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
      formData={formData}
      formElements={formElements}
      hidden={!visibleSectionIds.includes(sectionId)}
      id={sectionId}
      key={sectionId}
      onFieldChange={onSectionFieldChange}
      onFieldErrorsChange={(newFieldErrors) => setFieldErrors(newFieldErrors)}
      renderFormElement={renderFormElement}
      setDefaultFormData={(defaultFormData) => onFormDataChange({ ...defaultFormData, ...formData })}
    />)}

    {renderSubmitButton()}
  </form>;
};

export default SchemaForm;
