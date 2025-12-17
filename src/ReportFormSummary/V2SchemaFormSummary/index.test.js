import React from 'react';
import V2SchemaFormSummary from './index';
import { Provider } from 'react-redux';

import { GPS_FORMATS } from '../../utils/location';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';
import { snareSchemaV2 } from '../../__test-helpers/fixtures/event-schemas';

describe('ReportFormSummary - V2SchemaFormSummary', () => {
  let store;
  beforeEach(() => {
    store = {
      view: {
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
        coordinateReferenceSystems: {
          storedSystems: [],
        },
      },
    };
  });

  const renderV2SchemaFormSummary = (props) => render(
    <Provider store={mockStore(store)}>
      <V2SchemaFormSummary
        eventSchema={snareSchemaV2}
        formData={{ number_of_snares_found: 3 }}
        {...props}
      />
    </Provider>
  );

  test('shows a v2 schema form summary', () => {
    const eventSchema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        properties: {
          date_field: {
            deprecated: false,
            description: '',
            format: 'date-time',
            title: 'Date Field',
            type: 'string',
          },
          numeric_field: {
            deprecated: false,
            description: '',
            title: 'Numeric Field',
            type: 'number',
          },
          text_field: {
            default: '',
            deprecated: false,
            description: '',
            title: 'Text Field',
            type: 'string',
          },
        },
        required: [
          'date_field',
        ],
        type: 'object',
        unevaluatedProperties: false,
      },
      ui: {
        fields: {
          date_field: {
            conditionalDependents: [],
            type: 'DATE_TIME',
            parent: 'section-2',
          },
          numeric_field: {
            conditionalDependents: [],
            placeholder: '',
            type: 'NUMERIC',
            parent: 'section-1',
          },
          text_field: {
            conditionalDependents: [],
            inputType: 'SHORT_TEXT',
            placeholder: '',
            type: 'TEXT',
            parent: 'section-1',
          },
        },
        headers: {
          'header-1': {
            label: 'Large Header',
            section: 'section-1',
            size: 'LARGE',
          },
          'header-2': {
            label: 'Medium Header',
            section: 'section-2',
            size: 'MEDIUM',
          },
        },
        order: [
          'section-2',
          'section-1',
        ],
        sections: {
          'section-1': {
            columns: 2,
            conditions: [],
            isActive: true,
            label: '',
            leftColumn: [
              {
                name: 'numeric_field',
                type: 'field',
              },
            ],
            rightColumn: [
              {
                name: 'header-1',
                type: 'header',
              },
              {
                name: 'text_field',
                type: 'field',
              },
            ],
          },
          'section-2': {
            columns: 1,
            conditions: [],
            isActive: true,
            label: 'Section 1 Label',
            leftColumn: [
              {
                name: 'header-2',
                type: 'header',
              },
              {
                name: 'date_field',
                type: 'field',
              },
            ],
            rightColumn: [],
          },
        },
      },
    };

    renderV2SchemaFormSummary({
      eventSchema,
      formData: {
        date_field: '',
        numeric_field: 10,
        text_field: 'Hello',
      },
    });

    expect(screen.getByText('Section 1 Label')).toBeInTheDocument();
    expect(screen.getByText('Medium Header')).toBeInTheDocument();
    expect(screen.getByText('Date Field')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('Numeric Field')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Large Header')).toBeInTheDocument();
    expect(screen.getByText('Text Field')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
