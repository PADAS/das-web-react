import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { clearUserContent } from '../ducks/user-content';
import { act, fireEvent, render, screen, within } from '../test-utils';
import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../utils/form-schemas/constants';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import normalizeDateTimeFieldValue from './utils/normalizeDateTimeFieldValue';
import useMapLocationMarkers from './utils/useMapLocationMarkers';

import SchemaForm from './';

jest.mock('./utils/useMapLocationMarkers', () => jest.fn());
jest.mock('./utils/normalizeDateTimeFieldValue', () => jest.fn((value) => value));
jest.mock(
  '../ducks/user-content',
  () => ({ clearUserContent: jest.fn(), removeFile: jest.fn(), uploadFile: jest.fn() })
);

describe('SchemaForm', () => {
  const onFormDataChange = jest.fn();
  const onFormSubmit = jest.fn();

  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const setLocationMarkers = jest.fn();

  let schema, store;
  beforeEach(() => {
    clearUserContent.mockReturnValue({ type: 'USER_CONTENT.CLEAR' });
    useMapLocationMarkers.mockImplementation(() => ({ blurLocationMarker, focusLocationMarker, setLocationMarkers }));

    schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        properties: {
          location_field: {
            deprecated: false,
            description: '',
            properties: {
              latitude: {
                maximum: 90,
                minimum: -90,
                type: 'number'
              },
              longitude: {
                maximum: 180,
                minimum: -180,
                type: 'number'
              }
            },
            required: ['latitude', 'longitude'],
            title: 'Location Field',
            type: 'object',
            unevaluatedProperties: false
          },
          text_field: {
            default: 'Default Value 1',
            deprecated: false,
            description: '',
            title: 'Text Field',
            type: 'string'
          },
          collection_field: {
            deprecated: false,
            description: '',
            items: {
              properties: {
                location_field_2: {
                  deprecated: false,
                  description: '',
                  properties: {
                    latitude: {
                      maximum: 90,
                      minimum: -90,
                      type: 'number'
                    },
                    longitude: {
                      maximum: 180,
                      minimum: -180,
                      type: 'number'
                    }
                  },
                  required: ['latitude', 'longitude'],
                  title: 'Location Field 2',
                  type: 'object',
                  unevaluatedProperties: false
                }
              },
              required: [],
              type: 'object',
              unevaluatedProperties: false
            },
            title: 'Collection Field',
            type: 'array',
            unevaluatedItems: false
          }
        },
        required: ['text_field'],
        type: 'object',
        unevaluatedProperties: false,
        allOf: [
          {
            if: {
              allOf: [
                {
                  properties: {
                    text_field: {
                      anyOf: [
                        {
                          allOf: [{ contains: { const: 'value' } }],
                          maxItems: 1,
                          type: 'array',
                        },
                        {
                          const: null,
                          type: 'boolean',
                        },
                        {
                          const: null,
                          type: 'number'
                        },
                        {
                          properties: {
                            value: {},
                          },
                          required: ['value'],
                          type: 'object',
                          unevaluatedProperties: false,
                        },
                        {
                          const: 'value',
                          type: 'string'
                        }
                      ]
                    }
                  },
                  required: ['text_field'],
                }
              ]
            },
            then: {
              properties: {
                text_field_2: {
                  default: '',
                  deprecated: false,
                  description: '',
                  title: 'Text Field 2',
                  type: 'string'
                }
              },
              required: []
            },
            'x-section': 'section-2'
          },
          {
            if: {
              allOf: [
                {
                  properties: {
                    text_field: {
                      anyOf: [
                        {
                          allOf: [{ contains: { const: 'invalid' } }],
                          maxItems: 1,
                          type: 'array',
                        },
                        {
                          const: null,
                          type: 'boolean',
                        },
                        {
                          const: null,
                          type: 'number'
                        },
                        {
                          properties: {
                            invalid: {},
                          },
                          required: ['invalid'],
                          type: 'object',
                          unevaluatedProperties: false,
                        },
                        {
                          const: 'invalid',
                          type: 'string'
                        }
                      ]
                    }
                  },
                  required: ['text_field'],
                }
              ]
            },
            then: {
              properties: {
                text_field_3: {
                  default: '',
                  deprecated: false,
                  description: '',
                  title: 'Text Field 3',
                  type: 'string'
                }
              },
              required: []
            },
            'x-section': 'section-1'
          }
        ]
      },
      ui: {
        fields: {
          text_field_3: {
            conditionalDependents: [],
            inputType: 'SHORT_TEXT',
            placeholder: '',
            type: 'TEXT',
            parent: 'section-1'
          },
          location_field: {
            conditionalDependents: [],
            type: 'LOCATION',
            parent: 'section-3'
          },
          text_field: {
            conditionalDependents: [
              'section-2',
              'section-1'
            ],
            inputType: 'SHORT_TEXT',
            placeholder: '',
            type: 'TEXT',
            parent: 'section-3'
          },
          collection_field: {
            buttonText: '',
            columns: 1,
            conditionalDependents: [],
            itemIdentifier: '',
            itemName: 'Item',
            leftColumn: ['collection_field.location_field_2'],
            rightColumn: [],
            type: 'COLLECTION',
            parent: 'section-3'
          },
          'collection_field.location_field_2': {
            conditionalDependents: [],
            type: 'LOCATION',
            parent: 'collection_field'
          },
          text_field_2: {
            conditionalDependents: [],
            inputType: 'SHORT_TEXT',
            placeholder: '',
            type: 'TEXT',
            parent: 'section-2'
          }
        },
        headers: {},
        order: ['section-3', 'section-2', 'section-1'],
        sections: {
          'section-3': {
            columns: 1,
            conditions: [],
            isActive: true,
            label: '',
            leftColumn: [
              {
                name: 'text_field',
                type: 'field'
              },
              {
                name: 'location_field',
                type: 'field'
              },
              {
                name: 'collection_field',
                type: 'field'
              }
            ],
            rightColumn: []
          },
          'section-2': {
            columns: 1,
            conditions: [
              {
                field: 'text_field',
                id: 'condition-uJ98mtxIoOvX17IIz_Ftx',
                operator: 'IS_EXACTLY',
                value: 'value'
              }
            ],
            isActive: true,
            label: '',
            leftColumn: [
              {
                name: 'text_field_2',
                type: 'field'
              }
            ],
            rightColumn: []
          },
          'section-1': {
            columns: 1,
            conditions: [
              {
                field: 'text_field',
                id: 'condition-t7dZY9V6UKQ0wRF-GLjI3',
                operator: 'IS_EXACTLY',
                value: 'invalid'
              }
            ],
            isActive: true,
            label: '',
            leftColumn: [
              {
                type: 'field',
                name: 'text_field_3'
              }
            ],
            rightColumn: []
          }
        }
      }
    };

    store = {
      data: {
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        mapLocationSelection: {
          isPickingLocation: false,
        },
        modals: {
          canShowModals: true,
        },
        showUserLocation: false,
        userLocation: null,
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSchemaForm = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SchemaForm
        anchorLocation={{ latitude: 10, longitude: 10 }}
        formData={{ text_field: 'a text value' }}
        hideMapLocationMarkers={false}
        onFormDataChange={onFormDataChange}
        onFormSubmit={onFormSubmit}
        readOnly={false}
        renderSubmitButton={() => <button type="submit">Submit</button>}
        schema={schema}
        shouldPopulateDefaultData={false}
        {...props}
      />
    </Provider>
  );

  test('sets the initial form data with the default inputs', async () => {
    renderSchemaForm({ shouldPopulateDefaultData: true });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith({ text_field: 'Default Value 1' });
  });

  test('does not set the initial form data if there are no default inputs', async () => {
    schema.json.properties.text_field.default = '';
    renderSchemaForm({ formData: {}, shouldPopulateDefaultData: true });

    expect(onFormDataChange).not.toHaveBeenCalled();
  });

  test('does not set the initial form data', async () => {
    renderSchemaForm();

    expect(onFormDataChange).not.toHaveBeenCalled();
  });

  test('does not set the initial form data after it has been set', async () => {
    const { rerender } = renderSchemaForm({ shouldPopulateDefaultData: true });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);

    rerender(
      <Provider store={mockStore({ ...store })}>
        <SchemaForm
          anchorLocation={{ latitude: 10, longitude: 10 }}
          formData={{ text_field: 'a text value' }}
          hideMapLocationMarkers={false}
          onFormDataChange={onFormDataChange}
          onFormSubmit={onFormSubmit}
          readOnly={false}
          renderSubmitButton={() => <button type="submit">Submit</button>}
          schema={schema}
          shouldPopulateDefaultData
        />
      </Provider>
    );

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
  });

  test('does not show the form fields as read only', async () => {
    renderSchemaForm();

    expect(screen.getByRole('textbox', { name: 'Text Field' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('group')).not.toHaveClass('readOnly');
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeEnabled();
  });

  test('shows the form fields as read only', async () => {
    renderSchemaForm({ readOnly: true });

    expect(screen.getByRole('textbox', { name: 'Text Field' })).toHaveAttribute('readonly');
    expect(screen.getByRole('group')).toHaveClass('readOnly');
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
  });

  test('focuses a location field if its marker is clicked', () => {
    let onMarkerClickCallback;
    useMapLocationMarkers.mockImplementation((_anchorLocation, onMarkerClick) => {
      onMarkerClickCallback = onMarkerClick;

      return { blurLocationMarker, focusLocationMarker, setLocationMarkers };
    });

    const locationFieldElement = { focus: jest.fn() };
    const originalGetElementById = document.getElementById;
    // The dom id is namespaced with the form instance id, which React generates.
    document.getElementById = jest.fn((id) => {
      if (id.endsWith('-location_field')) {
        return locationFieldElement;
      }
      return undefined;
    });

    renderSchemaForm();

    expect(locationFieldElement.focus).toHaveBeenCalledTimes(0);

    onMarkerClickCallback('location_field');

    expect(locationFieldElement.focus).toHaveBeenCalledTimes(1);

    document.getElementById = originalGetElementById;
  });

  test('focuses a collection item if the marker of a location field inside it is clicked', () => {
    let onMarkerClickCallback;
    useMapLocationMarkers.mockImplementation((_anchorLocation, onMarkerClick) => {
      onMarkerClickCallback = onMarkerClick;

      return { blurLocationMarker, focusLocationMarker, setLocationMarkers };
    });

    const collectionItemElement = { focus: jest.fn() };
    const originalGetElementById = document.getElementById;
    // The collection item is in the document, and its dom id is namespaced with the form instance
    // id, which React generates.
    document.getElementById = jest.fn((id) => {
      if (id.endsWith('-collection_field[0]')) {
        return collectionItemElement;
      }
      return undefined;
    });

    renderSchemaForm();

    expect(collectionItemElement.focus).toHaveBeenCalledTimes(0);

    onMarkerClickCallback('collection_field[0].location_field_2');

    expect(collectionItemElement.focus).toHaveBeenCalledTimes(1);

    document.getElementById = originalGetElementById;
  });

  test('only shows the sections with passing conditions', () => {
    renderSchemaForm({
      formData: {
        text_field: 'value',
      },
    });

    // section-3 has no conditions, so it should always be visible
    expect(screen.getByTestId('schema-form-section-section-3')).toBeVisible();
    expect(screen.getByTestId('schema-form-text-field-text_field')).toBeVisible();

    // section-2 has condition text_field is exactly "value", which passes, so it should be visible
    expect(screen.getByTestId('schema-form-section-section-2')).toBeVisible();
    expect(screen.getByTestId('schema-form-text-field-text_field_2')).toBeVisible();

    // section-1 has condition text_field is exactly "invalid", which fails, so it should not be visible
    expect(screen.getByTestId('schema-form-section-section-1')).not.toBeVisible();
    expect(screen.getByTestId('schema-form-text-field-text_field_3')).not.toBeVisible();
  });

  test('shows schema errors if there are any when the user submits the form', async () => {
    renderSchemaForm({ formData: { text_field: undefined } });

    const alert = screen.getByRole('alert');
    const inputField = screen.getByRole('textbox', { name: 'Text Field' });

    expect(alert).not.toHaveTextContent('There are validation errors in the following fields:');
    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();
    expect(inputField).not.toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(alert).toHaveTextContent('There are validation errors in the following fields:');
    expect(alert).toHaveTextContent('Text Field');
    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');
    expect(inputField).toHaveFocus();
  });

  test('shows upload errors if there are any when the user submits the form', async () => {
    schema.json.properties.attachment_field = {
      description: '',
      title: 'Attachment Field',
      type: 'array',
      items: { properties: { uploadId: { type: 'string' } }, type: 'object' },
      unevaluatedItems: false,
    };
    schema.ui.fields.attachment_field = {
      allowableFileTypes: [],
      conditionalDependents: [],
      isRequired: false,
      maxItems: null,
      type: 'ATTACHMENT',
      parent: 'section-3',
    };
    schema.ui.sections['section-3'].leftColumn.push({ name: 'attachment_field', type: 'field' });

    renderSchemaForm(
      { formData: { text_field: 'a text value', attachment_field: [{ uploadId: 'pending-upload-id' }] } },
      { data: { userContent: { 'pending-upload-id': { uploadId: 'pending-upload-id', filename: 'test.pdf', progress: null, status: 'in_progress' } } } }
    );

    const alert = screen.getByRole('alert');
    const attachmentField = screen.getByRole('group', { name: 'Attachment Field' });

    expect(alert).not.toHaveTextContent('There are validation errors in the following fields:');
    expect(attachmentField).not.toBeInvalid();
    expect(attachmentField).not.toHaveAccessibleErrorMessage();
    expect(attachmentField).not.toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(alert).toHaveTextContent('There are validation errors in the following fields:');
    expect(alert).toHaveTextContent('Attachment Field');
    expect(attachmentField).toBeInvalid();
    expect(attachmentField).toHaveAccessibleErrorMessage('Please wait for files to finish uploading.');
    expect(attachmentField).toHaveFocus();
  });

  test('submits the form when there are no field errors', async () => {
    renderSchemaForm();

    expect(onFormSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).not.toHaveTextContent('There are validation errors in the following fields:');
  });

  test('updates the form data when the user changes a field', async () => {
    renderSchemaForm();

    expect(onFormDataChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Text Field *'), ' ');

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenLastCalledWith({ text_field: 'a text value ' });
  });

  test('removes fields from the form data when the section that contains them is hidden', async () => {
    renderSchemaForm({
      formData: {
        text_field: 'value',
        text_field_2: 'some value',
      },
    });

    await userEvent.type(screen.getByRole('textbox', { name: 'Text Field' }), ' ');

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenLastCalledWith({ text_field: 'value ' });
  });

  test('sets the map location markers', () => {
    renderSchemaForm({
      formData: {
        location_field: {
          latitude: 15,
          longitude: 15,
        },
      },
    });

    expect(setLocationMarkers).toHaveBeenCalledTimes(1);
    expect(setLocationMarkers).toHaveBeenCalledWith({
      location_field: {
        latitude: 15,
        longitude: 15,
      },
    });
  });

  test('focuses a location marker when the user focuses a location field', async () => {
    renderSchemaForm({
      formData: {
        location_field: {
          latitude: 15,
          longitude: 15,
        },
      },
    });

    expect(focusLocationMarker).not.toHaveBeenCalled();

    fireEvent.focus(screen.getByRole('textbox', { name: 'Location Field' }));

    expect(focusLocationMarker).toHaveBeenCalled();
    expect(focusLocationMarker).toHaveBeenCalledWith('location_field');
  });

  test('updates the field errors', async () => {
    renderSchemaForm({ formData: { text_field: undefined } });

    const inputField = screen.getByLabelText('Text Field *');
    await userEvent.type(inputField, '{enter}');

    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');

    await userEvent.type(inputField, 'N');

    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();
  });

  test('renders the submit button', async () => {
    renderSchemaForm();

    expect(screen.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('normalizes a date-time field value', () => {
    schema.json.properties.datetime_field = {
      deprecated: false,
      description: '',
      format: 'date-time',
      title: 'Date Time Field',
      type: 'string',
    };
    schema.ui.fields.datetime_field = {
      conditionalDependents: [],
      parent: 'section-3',
      type: 'DATE_TIME',
    };
    schema.ui.sections['section-3'].leftColumn.push({
      name: 'datetime_field',
      type: 'field',
    });

    const rawDateTimeValue = '2024-06-01 10:30:00';
    renderSchemaForm({
      formData: {
        text_field: 'a text value',
        datetime_field: rawDateTimeValue,
      },
    });

    expect(screen.getByTestId('schema-form-date-time-field-datetime_field')).toBeVisible();
    expect(normalizeDateTimeFieldValue).toHaveBeenCalledWith(
      rawDateTimeValue,
      DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
    );
  });

  test('normalizes a time field value', () => {
    schema.json.properties.time_field = {
      deprecated: false,
      description: '',
      format: 'time',
      title: 'Time Field',
      type: 'string',
    };
    schema.ui.fields.time_field = {
      conditionalDependents: [],
      parent: 'section-3',
      type: 'DATE_TIME',
    };
    schema.ui.sections['section-3'].leftColumn.push({
      name: 'time_field',
      type: 'field',
    });

    const rawTimeValue = '14:05:00';
    renderSchemaForm({
      formData: {
        text_field: 'a text value',
        time_field: rawTimeValue,
      },
    });

    expect(screen.getByTestId('schema-form-date-time-field-time_field')).toBeVisible();
    expect(normalizeDateTimeFieldValue).toHaveBeenCalledWith(
      rawTimeValue,
      DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
    );
  });

  test('dispatches clearUserContent when the component unmounts', () => {
    const { unmount } = renderSchemaForm({});

    expect(clearUserContent).not.toHaveBeenCalled();

    unmount();

    expect(clearUserContent).toHaveBeenCalledTimes(1);
  });

  describe('rendered more than once in the same document', () => {
    const addChoiceListFieldToSchema = () => {
      schema.json.properties.choice_field = {
        anyOf: [{
          enum: ['option-1'],
          'x-enumExtra': { 'option-1': { description: '', display: 'Option 1' } },
        }, {
          enum: ['option-2'],
          'x-enumExtra': { 'option-2': { description: '', display: 'Option 2' } },
        }],
        deprecated: false,
        description: '',
        title: 'Choice Field',
        type: 'string',
      };
      schema.ui.fields.choice_field = {
        conditionalDependents: [],
        inputType: 'LIST',
        parent: 'section-3',
        placeholder: '',
        type: 'CHOICE_LIST',
      };
      schema.ui.sections['section-3'].leftColumn.push({ name: 'choice_field', type: 'field' });
    };

    // Both forms are controlled, so the tests own their form data to tell a selection in one apart
    // from a selection in the other.
    const ControlledSchemaForms = () => {
      const [firstFormData, setFirstFormData] = useState({});
      const [secondFormData, setSecondFormData] = useState({});

      const renderSchemaFormInWrapper = (testId, formData, onFormDataChange) => <div data-testid={testId}>
        <SchemaForm
          anchorLocation={null}
          formData={formData}
          hideMapLocationMarkers={false}
          onFormDataChange={onFormDataChange}
          onFormSubmit={onFormSubmit}
          readOnly={false}
          renderSubmitButton={() => null}
          schema={schema}
          shouldPopulateDefaultData={false}
        />
      </div>;

      return <>
        {renderSchemaFormInWrapper('firstForm', firstFormData, setFirstFormData)}

        {renderSchemaFormInWrapper('secondForm', secondFormData, setSecondFormData)}
      </>;
    };

    const renderTwoSchemaForms = () => render(
      <Provider store={mockStore(store)}>
        <ControlledSchemaForms />
      </Provider>
    );

    test('gives each instance its own dom ids', () => {
      renderTwoSchemaForms();

      const firstForm = screen.getByTestId('firstForm');
      const secondForm = screen.getByTestId('secondForm');

      // Each label reaches its own control, otherwise these queries would find nothing.
      const firstTextField = within(firstForm).getByRole('textbox', { name: 'Text Field' });
      const secondTextField = within(secondForm).getByRole('textbox', { name: 'Text Field' });

      expect(firstTextField.id).not.toBe(secondTextField.id);

      const firstDescriptionId = firstTextField.getAttribute('aria-describedby');
      const secondDescriptionId = secondTextField.getAttribute('aria-describedby');

      expect(firstDescriptionId).not.toBe(secondDescriptionId);
      expect(firstForm).toContainElement(document.getElementById(firstDescriptionId));
      expect(secondForm).toContainElement(document.getElementById(secondDescriptionId));
    });

    test('keeps the choice lists of each instance in separate radio groups', async () => {
      addChoiceListFieldToSchema();
      renderTwoSchemaForms();

      const firstChoiceField = within(screen.getByTestId('firstForm')).getByRole('radio', { name: 'Option 1' });
      const secondChoiceField = within(screen.getByTestId('secondForm')).getByRole('radio', { name: 'Option 2' });

      expect(firstChoiceField.name).not.toBe(secondChoiceField.name);

      await userEvent.click(firstChoiceField);
      await userEvent.click(secondChoiceField);

      expect(firstChoiceField).toBeChecked();
      expect(secondChoiceField).toBeChecked();
    });
  });

  describe('rendered without owning a form element', () => {
    const renderSchemaFormWithoutFormElement = (props) => {
      const validateRef = { current: null };

      const renderResult = renderSchemaForm({ as: 'div', validateRef, ...props });

      return { ...renderResult, validateRef };
    };

    test('does not render a form element', () => {
      const { container } = renderSchemaFormWithoutFormElement();

      expect(container.querySelector('form')).toBeNull();
    });

    test('shows the schema errors and reports the failure when its validate method is called', () => {
      const { validateRef } = renderSchemaFormWithoutFormElement({ formData: { text_field: undefined } });

      const inputField = screen.getByRole('textbox', { name: 'Text Field' });

      expect(inputField).toBeValid();

      let isValid;
      act(() => {
        isValid = validateRef.current.validate();
      });

      expect(isValid).toBe(false);
      expect(inputField).toBeInvalid();
      expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');
      expect(screen.getByRole('alert')).toHaveTextContent('There are validation errors in the following fields:');
    });

    test('does not focus the first erroneous field when its validate method is told not to', () => {
      const { validateRef } = renderSchemaFormWithoutFormElement({ formData: { text_field: undefined } });

      const inputField = screen.getByRole('textbox', { name: 'Text Field' });

      let isValid;
      act(() => {
        isValid = validateRef.current.validate({ shouldFocusFirstError: false });
      });

      expect(isValid).toBe(false);
      expect(inputField).toBeInvalid();
      expect(inputField).not.toHaveFocus();
    });

    test('reports the success when its validate method is called and there are no errors', () => {
      const { validateRef } = renderSchemaFormWithoutFormElement();

      let isValid;
      act(() => {
        isValid = validateRef.current.validate();
      });

      expect(isValid).toBe(true);
      expect(screen.getByRole('alert')).not.toHaveTextContent('There are validation errors in the following fields:');
    });

    test('does not dispatch clearUserContent when the component unmounts', () => {
      const { unmount } = renderSchemaFormWithoutFormElement();

      unmount();

      expect(clearUserContent).not.toHaveBeenCalled();
    });

    test('applies the class name it is given to the element it renders in place of the form', () => {
      const { container } = renderSchemaFormWithoutFormElement({ className: 'aClassName' });

      expect(container.querySelector('.aClassName')).toBeInTheDocument();
    });
  });

  test('applies the class name it is given to the form element it owns', () => {
    const { container } = renderSchemaForm({ className: 'aClassName' });

    expect(container.querySelector('form.aClassName')).toBeInTheDocument();
  });
});
