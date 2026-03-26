import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../../../test-utils';
import getFormDataWithFixedTimezones from './utils/getFormDataWithFixedTimezones';
import { GPS_FORMATS } from '../../../utils/location';
import { mockStore } from '../../../__test-helpers/MockStore';
import transformSchemaToFormElements from '../../../utils/v2-event-schemas/transformSchemaToFormElements';
import useMapLocationMarkers from './utils/useMapLocationMarkers';

import SchemaForm from './';

jest.mock('./utils/useMapLocationMarkers', () => jest.fn());

describe('ReportManager - DetailsSection - SchemaForm', () => {
  const onFormDataChange = jest.fn();
  const onFormSubmit = jest.fn();

  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const setLocationMarkers = jest.fn();

  let schema, store;
  beforeEach(() => {
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
            leftColumn: ['location_field_2'],
            rightColumn: [],
            type: 'COLLECTION',
            parent: 'section-3'
          },
          location_field_2: {
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
        eventId="event-id"
        eventLocation={{ latitude: 10, longitude: 10 }}
        formData={{ text_field: 'a text value' }}
        hideMapLocationMarkers={false}
        isNewEvent={false}
        onFormDataChange={onFormDataChange}
        onFormSubmit={onFormSubmit}
        readOnly={false}
        renderSubmitButton={() => <button type="submit">Submit</button>}
        schema={schema}
        {...props}
      />
    </Provider>
  );

  test('sets the initial form data for a new event with default inputs', async () => {
    renderSchemaForm({ isNewEvent: true });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith({ text_field: 'Default Value 1' });
  });

  test('does not set the initial form data for a new event without default inputs', async () => {
    schema.json.properties.text_field.default = '';
    renderSchemaForm({ formData: {}, isNewEvent: true });

    expect(onFormDataChange).not.toHaveBeenCalled();
  });

  test('sets the initial form data for an existing event with time data that needs timezone correction', async () => {
    schema.json.properties.date_time_field = {
      deprecated: false,
      description: '',
      format: 'date-time',
      title: 'Date Time Field',
      type: 'string',
    };
    schema.ui.fields.date_time_field = {
      conditionalDependents: [],
      type: 'DATE_TIME',
      parent: 'section-3',
    };
    schema.ui.sections['section-3'].leftColumn = [
      ...schema.ui.sections['section-3'].leftColumn,
      { name: 'date_time_field', type: 'field' },
    ];
    schema.ui.sections['section-3'].leftColumn = [
      ...schema.ui.sections['section-3'].leftColumn,
      { name: 'date_time_field', type: 'field' },
    ];

    const formElements = transformSchemaToFormElements(schema);
    const formData = {
      text_field: 'a text value',
      date_time_field: '2024-06-15T14:30:45',
    };

    renderSchemaForm({ formData });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith(getFormDataWithFixedTimezones(formData, formElements));
  });

  test('does not set the initial form data for an existing event without time data that needs timezone correction', async () => {
    renderSchemaForm();

    expect(onFormDataChange).not.toHaveBeenCalled();
  });

  test('does not set the initial form data after it has been set', async () => {
    const { rerender } = renderSchemaForm({ isNewEvent: true });

    expect(onFormDataChange).toHaveBeenCalledTimes(1);

    rerender(
      <Provider store={mockStore({ ...store })}>
        <SchemaForm
          eventId="event-id"
          eventLocation={{ latitude: 10, longitude: 10 }}
          formData={{ text_field: 'a text value' }}
          hideMapLocationMarkers={false}
          isNewEvent
          onFormDataChange={onFormDataChange}
          onFormSubmit={onFormSubmit}
          readOnly={false}
          renderSubmitButton={() => <button type="submit">Submit</button>}
          schema={schema}
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
    useMapLocationMarkers.mockImplementation((_eventId, _eventLocation, onMarkerClick) => {
      onMarkerClickCallback = onMarkerClick;

      return { blurLocationMarker, focusLocationMarker, setLocationMarkers };
    });

    const locationFieldElement = { focus: jest.fn() };
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      if (id === 'location_field') {
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
    useMapLocationMarkers.mockImplementation((_eventId, _eventLocation, onMarkerClick) => {
      onMarkerClickCallback = onMarkerClick;

      return { blurLocationMarker, focusLocationMarker, setLocationMarkers };
    });

    const collectionItemElement = { focus: jest.fn() };
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      // The collection item is in the document
      if (id === 'collection_field.0') {
        return collectionItemElement;
      }
      return undefined;
    });

    renderSchemaForm();

    expect(collectionItemElement.focus).toHaveBeenCalledTimes(0);

    onMarkerClickCallback('collection_field.0.location_field_2');

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

  test('shows validation errors if there are any when the user submits the form', async () => {
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

  test('submits the form when there are no validation errors', async () => {
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

    fireEvent.focus(screen.getByRole('textbox', { name: 'Location' }));

    expect(focusLocationMarker).toHaveBeenCalled();
    expect(focusLocationMarker).toHaveBeenCalledWith('location_field');
  });

  test('updates the field errors', async () => {
    renderSchemaForm({ formData: { this_is_a_text: undefined } });

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
});
