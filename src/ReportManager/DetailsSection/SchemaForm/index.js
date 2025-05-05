import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from './constants';
import makeFieldsFromSchema from './utils/makeFieldsFromSchema';
import useMapLocationMarkers from './utils/useMapLocationMarkers';
import useSchemaValidations from './utils/useSchemaValidations';

import Collection from './fields/Collection';
import ChoiceList from './fields/ChoiceList';
import DateTime from './fields/DateTime';
import Header from './fields/Header';
import Location from './fields/Location';
import Numeric from './fields/Numeric';
import Section from './fields/Section';
import Text from './fields/Text';

export const FIELDS = {
  [FORM_ELEMENT_TYPES.CHOICE_LIST]: ChoiceList,
  [FORM_ELEMENT_TYPES.DATE_TIME]: DateTime,
  [FORM_ELEMENT_TYPES.NUMERIC]: Numeric,
  [FORM_ELEMENT_TYPES.TEXT]: Text,
};

const SchemaForm = ({
  autofillDefaultInputs,
  eventId,
  eventLocation,
  hideMapLocationMarkers,
  initialFormData,
  onFormDataChange,
  onFormSubmit,
  renderSubmitButton,
  schema,
}) => {
  const runValidations = useSchemaValidations(schema);

  const onLocationMarkerClick = useCallback((markerId) => {
    const locationField = document.getElementById(markerId);
    if (locationField) {
      locationField.focus();
    } else {
      // If the location field of the clicked marker is not defined, it will be contained by a collection item, so we
      // try to calculate the collection item id to focus it.
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

  // This ref works as a flag to trigger a useEffect and call onFormDataChange asynchronously when there are changes in
  // the form data, so we can keep the onSectionFieldChange dependency array empty.
  const shouldSendFormDataChangeRef = useRef(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  const fields = useMemo(() => makeFieldsFromSchema(schema), [schema]);

  const onSectionFieldChange = useCallback((fieldId, value) => {
    setFormData((formData) => ({ ...formData, [fieldId]: value }));

    shouldSendFormDataChangeRef.current = true;
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = runValidations(formData);
    if (fieldErrors) {
      setFieldErrors(fieldErrors);

      // If there are validation errors we focus the first erroneous field if it is visible (it may be inside a
      // collection).
      const idOfFirstErroneousField = Object.keys(fieldErrors)[0];
      const elementWithError = document.getElementById(idOfFirstErroneousField);
      elementWithError?.focus();
    } else {
      onFormSubmit();
    }
  };

  // This method is designed to render fields inside sections and collections. In order to support recursion we let the
  // parents handle the propagation of values, change callbacks, errors, focusing of location markers and breadcrumbs
  // (only for collections).
  const renderField = (id, value, onChange, error, focusLocationMarker, breadcrumbs = []) => {
    switch (fields[id].type) {
    case FORM_ELEMENT_TYPES.HEADER:
      return <Header details={fields[id].details} id={id} key={id} />;

    case FORM_ELEMENT_TYPES.COLLECTION:
      return <Collection
        blurLocationMarker={blurLocationMarker}
        breadcrumbs={breadcrumbs}
        details={fields[id].details}
        error={error}
        fields={fields}
        focusLocationMarker={focusLocationMarker}
        id={id}
        key={id}
        onFieldChange={onChange}
        renderField={renderField}
        value={value}
      />;

    case FORM_ELEMENT_TYPES.LOCATION:
      return <Location
        blurLocationMarker={blurLocationMarker}
        details={fields[id].details}
        error={error}
        focusLocationMarker={focusLocationMarker}
        id={id}
        key={id}
        onFieldChange={onChange}
        value={value}
      />;

    default:
      const Field = FIELDS[fields[id].type];
      return <Field
        autofillDefaultInput={autofillDefaultInputs && !value}
        details={fields[id].details}
        error={error}
        id={id}
        key={id}
        onFieldChange={onChange}
        value={value}
      />;
    }
  };

  useEffect(() => {
    if (shouldSendFormDataChangeRef.current) {
      onFormDataChange(formData);

      shouldSendFormDataChangeRef.current = false;
    }
  }, [formData, onFormDataChange]);

  useEffect(() => {
    // Update the location markers whenever there is a change.
    const locationMarkers = {};
    const addLocationMarkersFromFormDataRecursively = (formData, idPrefix = '') => {
      Object.entries(formData).forEach(([fieldId, fieldValue]) => {
        if (fields[fieldId]?.type === FORM_ELEMENT_TYPES.LOCATION && fieldValue) {
          // If the field is a location with a value, add it to the location markers.
          locationMarkers[`${idPrefix}${fieldId}`] = fieldValue;
        } else if (fields[fieldId]?.type === FORM_ELEMENT_TYPES.COLLECTION) {
          // If the field is a collection, add the location markers for each of its items recursively with a prefix to
          // differentiate the same fields in different collection items.
          fieldValue.forEach((itemFormData, index) => addLocationMarkersFromFormDataRecursively(
            itemFormData,
            `${idPrefix}${fieldId}.${index}.`
          ));
        }
      });
    };
    addLocationMarkersFromFormDataRecursively(formData);

    setLocationMarkers(locationMarkers);
  }, [fields, formData, setLocationMarkers]);

  return <form onSubmit={onSubmit}>
    {fields[ROOT_CANVAS_ID]?.details.fields.map((sectionId) => <Section
      details={fields[sectionId].details}
      fieldErrors={fieldErrors}
      focusLocationMarker={focusLocationMarker}
      formData={formData}
      id={sectionId}
      key={sectionId}
      onFieldChange={onSectionFieldChange}
      onFieldErrorsChange={(newFieldErrors) => setFieldErrors(newFieldErrors)}
      renderField={renderField}
    />)}

    {renderSubmitButton()}
  </form>;
};

export default SchemaForm;
