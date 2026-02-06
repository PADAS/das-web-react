import React, { useCallback, useEffect, useMemo, useState } from 'react';

import evaluateSectionConditions from './utils/evaluateSectionConditions';
import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../../utils/v2-event-schemas/constants';
import transformSchemaToFormElements from '../../../utils/v2-event-schemas/transformSchemaToFormElements';
import useMapLocationMarkers from './utils/useMapLocationMarkers';
import useSchemaValidations from './utils/useSchemaValidations';

import Boolean from './fields/Boolean';
import Collection from './fields/Collection';
import ChoiceList from './fields/ChoiceList';
import DateTime from './fields/DateTime';
import Header from './fields/Header';
import Location from './fields/Location';
import Numeric from './fields/Numeric';
import Section from './fields/Section';
import Text from './fields/Text';

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
      formData
    ));

const SchemaForm = ({
  autofillDefaultInputs,
  eventId,
  eventLocation,
  formData,
  hideMapLocationMarkers,
  onFormDataChange,
  onFormSubmit,
  renderSubmitButton,
  schema,
}) => {
  const runValidations = useSchemaValidations(schema);

  const onLocationMarkerClick = useCallback((markerId) => {
    const locationField = document.getElementById(markerId);
    if (locationField) {
      // The location field is in the document, focus it.
      locationField.focus();
    } else {
      // The location field is not in the document, it must be contained by a
      // collection item. Calculate the collection item id to focus it.
      const markerIdPathParts = markerId.split('.');
      const collectionItemId = `${markerIdPathParts[0]}.${markerIdPathParts[1]}`;
      document.getElementById(collectionItemId)?.focus();
    }
  }, []);

  const {
    blurLocationMarker,
    focusLocationMarker,
    setLocationMarkers,
  } = useMapLocationMarkers(eventId, eventLocation, onLocationMarkerClick, hideMapLocationMarkers);

  const [fieldErrors, setFieldErrors] = useState({});
  const [shouldAutofillDefaultInputs, setShouldAutofillDefaultInputs] = useState(autofillDefaultInputs);

  const formElements = useMemo(() => transformSchemaToFormElements(schema), [schema]);

  const visibleSectionIds = useMemo(
    () => getVisibleSectionIds(formElements, formData),
    [formData, formElements]
  );

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);

      // Focus the first erroneous field if possible (it may be inside a
      // collection).
      const idOfFirstErroneousField = Object.keys(fieldErrors)[0];
      const elementWithError = document.getElementById(idOfFirstErroneousField);
      elementWithError?.focus();
    } else {
      onFormSubmit();
    }
  };

  const onSectionFieldChange = (fieldId, value) => {
    const newFormData = { ...formData, [fieldId]: value };

    // Conditional sections can depend on fields in other conditional sections.
    // Remove hidden fields from the form data in a loop until all sections
    // that will be hidden are iterated.
    let previousVisibleSectionIds = visibleSectionIds;
    while (true) {
      const currentVisibleSectionIds = getVisibleSectionIds(formElements, newFormData);
      const currentHiddenSectionIds = previousVisibleSectionIds.filter((id) => !currentVisibleSectionIds.includes(id));
      const currentHiddenFields = currentHiddenSectionIds.flatMap((sectionId) => [
        ...formElements[sectionId].details.leftColumn,
        ...formElements[sectionId].details.rightColumn,
      ]).filter((fieldId) => fieldId in newFormData);
      if (currentHiddenFields.length > 0) {
        // There are fields to hide in the current iteration. Remove them from
        // the form data.
        currentHiddenFields.forEach((fieldId) => delete newFormData[fieldId]);

        previousVisibleSectionIds = currentVisibleSectionIds;
      } else {
        // There are no more fields to hide. The form data is stable.
        break;
      }
    }

    onFormDataChange(newFormData);
  };

  // This method is designed to render fields inside sections and collections.
  const renderField = (id, value, onChange, error, focusLocationMarker, breadcrumbs = []) => {
    switch (formElements[id].type) {
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
        renderField={renderField}
        value={value}
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
        value={value}
      />;

    default:
      const Field = FIELDS[formElements[id].type];
      return <Field
        details={formElements[id].details}
        error={error}
        id={id}
        key={id}
        onFieldChange={onChange}
        value={value}
      />;
    }
  };

  useEffect(() => {
    if (shouldAutofillDefaultInputs) {
      // The "should autofill default inputs" flag is on, meaning that this is
      // a new event and the initial form data hasn't been set. Set the initial
      // form data from the default values of the fields in the visible
      // sections.
      const initialFormData = visibleSectionIds.reduce((accumulator, sectionId) => {
        const sectionChildrenIds = [
          ...formElements[sectionId].details.leftColumn,
          ...formElements[sectionId].details.rightColumn,
        ];
        sectionChildrenIds.forEach((sectionChildId) => {
          if (formElements[sectionChildId].details.defaultInput) {
            accumulator[sectionChildId] = formElements[sectionChildId].details.defaultInput;
          }
        });
        return accumulator;
      }, {});

      if (Object.keys(initialFormData).length > 0) {
        onFormDataChange(initialFormData);
      }

      setShouldAutofillDefaultInputs(false);
    }
  }, [formElements, onFormDataChange, shouldAutofillDefaultInputs, visibleSectionIds]);

  useEffect(() => {
    // Update the location markers when there is a change in the form data.
    const locationMarkers = {};
    const addLocationMarkersFromFormDataRecursively = (formData, idPrefix = '') => {
      Object.entries(formData).forEach(([fieldId, fieldValue]) => {
        if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.LOCATION && fieldValue) {
          // The field is a location with a value, add it to the location
          // markers.
          locationMarkers[`${idPrefix}${fieldId}`] = fieldValue;
        } else if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.COLLECTION) {
          // The field is a collection, add the location markers for each of
          // its items recursively with a prefix to differentiate the same
          // fields in different collection items.
          fieldValue.forEach((itemFormData, index) => addLocationMarkersFromFormDataRecursively(
            itemFormData,
            `${idPrefix}${fieldId}.${index}.`
          ));
        }
      });
    };

    addLocationMarkersFromFormDataRecursively(formData);

    setLocationMarkers(locationMarkers);
  }, [formData, formElements, setLocationMarkers]);

  return <form onSubmit={onSubmit}>
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
      renderField={renderField}
      setDefaultFormData={(defaultFormData) => onFormDataChange({ ...defaultFormData, ...formData })}
    />)}

    {renderSubmitButton()}
  </form>;
};

export default SchemaForm;
