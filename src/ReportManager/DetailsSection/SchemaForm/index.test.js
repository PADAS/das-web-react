import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';
import { GPS_FORMATS } from '../../../utils/location';
import { mockStore } from '../../../__test-helpers/MockStore';
import useMapLocationMarkers from './utils/useMapLocationMarkers';

import SchemaForm from './';

jest.mock('./utils/useMapLocationMarkers', () => jest.fn());

describe('ReportManager - DetailsSection - SchemaForm', () => {
  const onFormDataChange = jest.fn();
  const onFormSubmit = jest.fn();
  const renderSubmitButton = jest.fn();

  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const setLocationMarkers = jest.fn();

  let schema, store;
  beforeEach(() => {
    useMapLocationMarkers.mockImplementation(() => ({ blurLocationMarker, focusLocationMarker, setLocationMarkers }));

    schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          this_is_a_text: {
            default: 'initial value',
            deprecated: false,
            description: 'some good description',
            title: 'This is a text',
            type: 'string',
          },
          this_is_a_collection: {
            deprecated: false,
            items: {
              additionalProperties: false,
              properties: {
                collection_text: {
                  default: '',
                  deprecated: false,
                  description: '',
                  title: 'Collection text',
                  type: 'string',
                },
              },
              required: [],
              type: 'object',
            },
            title: 'This is a collection',
            type: 'array',
            unevaluatedItems: false,
          },
        },
        required: ['this_is_a_text'],
        type: 'object',
      },
      ui: {
        fields: {
          this_is_a_text: {
            inputType: 'SHORT_TEXT',
            placeholder: 'a placeholder',
            type: 'TEXT',
            parent: 'section-_PdgePvPWyACfu9sgN_F6',
          },
          this_is_a_collection: {
            buttonText: 'a button text',
            columns: 1,
            itemIdentifier: 'collection_text',
            leftColumn: ['collection_text'],
            parent: 'section-_PdgePvPWyACfu9sgN_F6',
            rightColumn: [],
            type: 'COLLECTION',
          },
          collection_text: {
            inputType: 'SHORT_TEXT',
            placeholder: '',
            type: 'TEXT',
            parent: 'this_is_a_collection',
          },
        },
        headers: {
          'header-ghqdjqGinaJMptIEJBQmO': {
            label: 'A great header',
            section: 'section-_PdgePvPWyACfu9sgN_F6',
            size: 'LARGE',
          },
        },
        order: ['section-_PdgePvPWyACfu9sgN_F6'],
        sections: {
          'section-_PdgePvPWyACfu9sgN_F6': {
            columns: 1,
            isActive: true,
            label: '',
            leftColumn: [
              {
                name: 'header-ghqdjqGinaJMptIEJBQmO',
                type: 'header',
              },
              {
                name: 'this_is_a_text',
                type: 'field',
              },
              {
                name: 'this_is_a_collection',
                type: 'field',
              },
            ],
            rightColumn: [],
          },
        },
      },
    };

    store = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        mapLocationSelection: {
          isPickingLocation: false,
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
        autofillDefaultInputs={false}
        eventId="event-id"
        eventLocation={{ latitude: 10, longitude: 10 }}
        hideMapLocationMarkers={false}
        initialFormData={{ this_is_a_text: 'a text value' }}
        onFormDataChange={onFormDataChange}
        onFormSubmit={onFormSubmit}
        renderSubmitButton={renderSubmitButton}
        schema={schema}
        {...props}
      />
    </Provider>
  );

  test('renders sections, fields, collections and headers from the schema', () => {
    renderSchemaForm();

    const section = screen.getByTestId('schema-form-section-section-_PdgePvPWyACfu9sgN_F6');
    const textField = screen.getByTestId('schema-form-text-field-this_is_a_text');
    const collectionField = screen.getByTestId('schema-form-collection-this_is_a_collection');
    const header = screen.getByTestId('schema-form-header-header-ghqdjqGinaJMptIEJBQmO');

    expect(section).toBeVisible();
    expect(textField).toBeVisible();
    expect(collectionField).toBeVisible();
    expect(header).toBeVisible();
  });

  test('sets the map location markers', () => {
    renderSchemaForm({
      initialFormData: {
        location_field: {
          latitude: 15,
          longitude: 15,
        },
      },
      schema: {
        json: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          additionalProperties: false,
          properties: {
            location_field: {
              deprecated: false,
              description: '',
              properties: {
                latitude: {
                  maximum: 90,
                  minimum: -90,
                  type: 'number',
                },
                longitude: {
                  maximum: 180,
                  minimum: -180,
                  type: 'number',
                },
              },
              title: 'Location field',
              type: 'object',
            },
          },
          required: [],
          type: 'object',
        },
        ui: {
          fields: {
            location_field: {
              type: 'LOCATION',
              parent: 'section-_PdgePvPWyACfu9sgN_F6',
            },
          },
          headers: {},
          order: ['section-_PdgePvPWyACfu9sgN_F6'],
          sections: {
            'section-_PdgePvPWyACfu9sgN_F6': {
              columns: 1,
              isActive: true,
              label: '',
              leftColumn: [
                {
                  name: 'location_field',
                  type: 'field',
                },
              ],
              rightColumn: [],
            },
          },
        },
      }
    });

    expect(setLocationMarkers).toHaveBeenCalledTimes(1);
    expect(setLocationMarkers).toHaveBeenCalledWith({
      location_field: {
        latitude: 15,
        longitude: 15,
      },
    });
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

    renderSchemaForm({
      schema: {
        json: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          additionalProperties: false,
          properties: {
            location_field: {
              deprecated: false,
              description: '',
              properties: {
                latitude: {
                  maximum: 90,
                  minimum: -90,
                  type: 'number',
                },
                longitude: {
                  maximum: 180,
                  minimum: -180,
                  type: 'number',
                },
              },
              title: 'Location field',
              type: 'object',
            },
          },
          required: [],
          type: 'object',
        },
        ui: {
          fields: {
            location_field: {
              type: 'LOCATION',
              parent: 'section-_PdgePvPWyACfu9sgN_F6',
            },
          },
          headers: {},
          order: ['section-_PdgePvPWyACfu9sgN_F6'],
          sections: {
            'section-_PdgePvPWyACfu9sgN_F6': {
              columns: 1,
              isActive: true,
              label: '',
              leftColumn: [
                {
                  name: 'location_field',
                  type: 'field',
                },
              ],
              rightColumn: [],
            },
          },
        },
      }
    });

    expect(locationFieldElement.focus).toHaveBeenCalledTimes(0);

    onMarkerClickCallback('location_field');

    expect(locationFieldElement.focus).toHaveBeenCalledTimes(1);

    document.getElementById = originalGetElementById;
  });

  test('renders the submit button', async () => {
    renderSchemaForm({ renderSubmitButton: () => <button data-testid="submit-button">Submit</button> });

    expect(screen.getByTestId('submit-button')).toBeVisible();
  });

  test('shows the values of the fields', async () => {
    renderSchemaForm();

    expect(screen.getByLabelText('This is a text *')).toHaveValue('a text value');
  });

  test('changes the field values when the user interacts with them', async () => {
    renderSchemaForm();

    const inputField = screen.getByLabelText('This is a text *');

    expect(inputField).toHaveValue('a text value');
    expect(onFormDataChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('This is a text *'), ' ');

    expect(inputField).toHaveValue('a text value ');
    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith({ this_is_a_text: 'a text value ' });
  });

  test('shows validation errors if there are any when the user submits the form', async () => {
    renderSchemaForm({ initialFormData: { this_is_a_text: undefined } });

    const inputField = screen.getByLabelText('This is a text *');

    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();

    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');
  });

  test('clears validation errors of a field when the user changes its value', async () => {
    renderSchemaForm({ initialFormData: { this_is_a_text: undefined } });

    const inputField = screen.getByLabelText('This is a text *');
    await userEvent.type(inputField, '{enter}');

    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');

    await userEvent.type(screen.getByLabelText('This is a text *'), 'a');

    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();
  });

  test('submits the form when there are no validation errors', async () => {
    renderSchemaForm();

    const inputField = screen.getByLabelText('This is a text *');
    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });
});
