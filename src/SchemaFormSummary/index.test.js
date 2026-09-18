import React from 'react';
import i18n from 'i18next';
import { Provider } from 'react-redux';

import { act, render, screen } from '../test-utils';
import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { snareSchemaV2 } from '../__test-helpers/fixtures/event-schemas';

import SchemaFormSummary from './';

const SCHEMA = {
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
    required: ['date_field'],
    type: 'object',
    unevaluatedProperties: false,
  },
  ui: {
    fields: {
      date_field: { conditionalDependents: [], parent: 'section-2', type: 'DATE_TIME' },
      numeric_field: { conditionalDependents: [], parent: 'section-1', placeholder: '', type: 'NUMERIC' },
      text_field: {
        conditionalDependents: [],
        inputType: 'SHORT_TEXT',
        parent: 'section-1',
        placeholder: '',
        type: 'TEXT',
      },
    },
    headers: {
      'header-1': { label: 'Large Header', section: 'section-1', size: 'LARGE' },
      'header-2': { label: 'Medium Header', section: 'section-2', size: 'MEDIUM' },
    },
    order: ['section-2', 'section-1'],
    sections: {
      'section-1': {
        columns: 2,
        conditions: [],
        isActive: true,
        label: '',
        leftColumn: [{ name: 'numeric_field', type: 'field' }],
        rightColumn: [{ name: 'header-1', type: 'header' }, { name: 'text_field', type: 'field' }],
      },
      'section-2': {
        columns: 1,
        conditions: [],
        isActive: true,
        label: 'Section 1 Label',
        leftColumn: [{ name: 'header-2', type: 'header' }, { name: 'date_field', type: 'field' }],
        rightColumn: [],
      },
    },
  },
};

const CONDITIONAL_SCHEMA = {
  json: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    allOf: [{
      if: { properties: { is_armed: { const: true } }, required: ['is_armed'] },
      then: {
        properties: { weapon_field: { description: '', title: 'Weapon Field', type: 'string' } },
        required: [],
      },
      'x-section': 'section-2',
    }],
    properties: { is_armed: { description: '', title: 'Armed', type: 'boolean' } },
    required: [],
    type: 'object',
    unevaluatedProperties: false,
  },
  ui: {
    fields: {
      is_armed: { parent: 'section-1', type: 'BOOLEAN' },
      weapon_field: { inputType: 'SHORT_TEXT', parent: 'section-2', type: 'TEXT' },
    },
    headers: {},
    order: ['section-1', 'section-2'],
    sections: {
      'section-1': {
        columns: 1,
        conditions: [],
        isActive: true,
        label: 'Team',
        leftColumn: [{ name: 'is_armed', type: 'field' }],
        rightColumn: [],
      },
      'section-2': {
        columns: 1,
        conditions: [{ field: 'is_armed', operator: 'IS_EXACTLY', value: 'true' }],
        isActive: true,
        label: 'Weapons',
        leftColumn: [{ name: 'weapon_field', type: 'field' }],
        rightColumn: [],
      },
    },
  },
};

const CHOICE_LIST_SCHEMA = {
  json: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties: {
      team_members: {
        items: {
          anyOf: [{
            enum: ['kumoi_njapit', 'sam_kumum'],
            'x-enumExtra': {
              kumoi_njapit: { display: 'Kumoi Njapit' },
              sam_kumum: { display: 'Sam Kumum' },
            },
          }],
        },
        title: 'Team Member',
        type: 'array',
      },
    },
    required: [],
    type: 'object',
    unevaluatedProperties: false,
  },
  ui: {
    fields: { team_members: { inputType: 'LIST', parent: 'section-1', type: 'CHOICE_LIST' } },
    headers: {},
    order: ['section-1'],
    sections: {
      'section-1': {
        columns: 1,
        conditions: [],
        isActive: true,
        label: 'Details',
        leftColumn: [{ name: 'team_members', type: 'field' }],
        rightColumn: [],
      },
    },
  },
};

describe('SchemaFormSummary', () => {
  let store;
  beforeEach(() => {
    store = {
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const renderSchemaFormSummary = (props) => render(
    <Provider store={mockStore(store)}>
      <SchemaFormSummary formData={{ number_of_snares_found: 3 }} schema={snareSchemaV2} {...props} />
    </Provider>
  );

  test('shows the label and the value of every field in the schema', () => {
    renderSchemaFormSummary({
      formData: { date_field: '', numeric_field: 10, text_field: 'Hello' },
      schema: SCHEMA,
    });

    expect(screen.getByText('Numeric Field')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Text Field')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Date Field')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('pairs every field label with its value in a definition list', () => {
    renderSchemaFormSummary({
      formData: { date_field: '', numeric_field: 10, text_field: 'Hello' },
      schema: SCHEMA,
    });

    expect(screen.getByText('Numeric Field').tagName).toBe('DT');
    expect(screen.getByText('10').tagName).toBe('DD');
    expect(screen.getByText('Numeric Field').closest('dl')).toBe(screen.getByText('10').closest('dl'));
  });

  test('shows the section labels and the schema headers as headings', () => {
    renderSchemaFormSummary({
      formData: { date_field: '', numeric_field: 10, text_field: 'Hello' },
      schema: SCHEMA,
    });

    expect(screen.getByRole('heading', { level: 3, name: 'Section 1 Label' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Large Header' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Medium Header' })).toBeInTheDocument();
  });

  test('shows the sections in the order of the schema', () => {
    renderSchemaFormSummary({
      formData: { date_field: '', numeric_field: 10, text_field: 'Hello' },
      schema: SCHEMA,
    });

    const headings = screen.getAllByRole('heading');

    expect(headings.map((heading) => heading.textContent))
      .toEqual(['Section 1 Label', 'Medium Header', 'Large Header']);
  });

  test('shows an affirmative or negative value for boolean fields', () => {
    const { unmount } = renderSchemaFormSummary({
      formData: { is_armed: true },
      schema: CONDITIONAL_SCHEMA,
    });

    expect(screen.getByText('Yes')).toBeInTheDocument();

    unmount();

    renderSchemaFormSummary({ formData: { is_armed: false }, schema: CONDITIONAL_SCHEMA });

    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('updates the humanized values when the user changes the language', async () => {
    renderSchemaFormSummary({ formData: { date_field: '2024-03-05T15:30:00Z' }, schema: SCHEMA });

    expect(screen.getByText('2024/03/05 03:30 PM')).toBeInTheDocument();

    await act(async () => { await i18n.changeLanguage('es'); });

    expect(screen.getByText('2024/03/05 15:30')).toBeInTheDocument();

    await act(async () => { await i18n.changeLanguage('en-US'); });
  });

  test('shows a conditional section when its conditions hold', () => {
    renderSchemaFormSummary({
      formData: { is_armed: true, weapon_field: 'Rifle' },
      schema: CONDITIONAL_SCHEMA,
    });

    expect(screen.getByText('Weapons')).toBeInTheDocument();
    expect(screen.getByText('Weapon Field')).toBeInTheDocument();
    expect(screen.getByText('Rifle')).toBeInTheDocument();
  });

  test('does not show a conditional section when its conditions do not hold', () => {
    renderSchemaFormSummary({ formData: { is_armed: false }, schema: CONDITIONAL_SCHEMA });

    expect(screen.queryByText('Weapons')).toBeNull();
    expect(screen.queryByText('Weapon Field')).toBeNull();
  });

  test('shows the display names of a legacy choice list stored as { name, value } objects', () => {
    renderSchemaFormSummary({
      formData: {
        team_members: [
          { name: 'Kumoi Njapit', value: 'kumoi_njapit' },
          { name: 'Sam Kumum', value: 'sam_kumum' },
        ],
      },
      schema: CHOICE_LIST_SCHEMA,
    });

    expect(screen.getByText('Team Member')).toBeInTheDocument();
    expect(screen.getByText('Kumoi Njapit, Sam Kumum')).toBeInTheDocument();
  });

  test('shows an empty value for a multiple choice list with no choices', () => {
    renderSchemaFormSummary({ formData: { team_members: [] }, schema: CHOICE_LIST_SCHEMA });

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('renders nothing when every section of the schema is hidden', () => {
    const onlyConditionalSectionSchema = {
      ...CONDITIONAL_SCHEMA,
      ui: {
        ...CONDITIONAL_SCHEMA.ui,
        order: ['section-2'],
        sections: { 'section-2': CONDITIONAL_SCHEMA.ui.sections['section-2'] },
      },
    };

    const { container } = renderSchemaFormSummary({
      formData: { is_armed: false },
      schema: onlyConditionalSectionSchema,
    });

    expect(container).toBeEmptyDOMElement();
  });
});
