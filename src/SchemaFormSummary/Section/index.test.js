import React from 'react';

import { FORM_ELEMENT_TYPES, HEADER_ELEMENT_SIZES, ROOT_CANVAS_ID } from '../../utils/form-schemas/constants';
import { GPS_FORMATS } from '../../utils/location';
import { render, screen } from '../../test-utils';

import Section from './';

const FORM_ELEMENTS = {
  'choice_field': {
    details: { isRequired: false, label: 'Choice Field', multiple: true, options: [], value: 'choice_field' },
    id: 'choice_field',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.CHOICE_LIST,
  },
  'header-1': {
    details: { label: 'Large Header', size: HEADER_ELEMENT_SIZES.LARGE },
    id: 'header-1',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.HEADER,
  },
  'header-2': {
    details: { label: 'Medium Header', size: HEADER_ELEMENT_SIZES.MEDIUM },
    id: 'header-2',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.HEADER,
  },
  'location_field': {
    details: { isRequired: false, label: 'Location Field', value: 'location_field' },
    id: 'location_field',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.LOCATION,
  },
  'numeric_field': {
    details: { isRequired: false, label: 'Numeric Field', value: 'numeric_field' },
    id: 'numeric_field',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.NUMERIC,
  },
  'text_field': {
    details: { isRequired: false, label: 'Text Field', value: 'text_field' },
    id: 'text_field',
    parentId: 'section-1',
    type: FORM_ELEMENT_TYPES.TEXT,
  },
};

describe('SchemaFormSummary - Section', () => {
  let section;
  beforeEach(() => {
    section = {
      details: {
        columns: 2,
        conditions: [],
        conditionsLogicalOperator: 'AND',
        label: 'Section Label',
        leftColumn: ['numeric_field', 'text_field'],
        rightColumn: ['location_field'],
      },
      id: 'section-1',
      parentId: ROOT_CANVAS_ID,
      type: FORM_ELEMENT_TYPES.SECTION,
    };
  });

  const renderSection = (props) => render(
    <Section
      coordinatesRepresentation={GPS_FORMATS.DEG}
      formData={{ numeric_field: 10, text_field: 'Hello' }}
      formElements={FORM_ELEMENTS}
      section={section}
      {...props}
    />
  );

  test('shows the section label as a heading', () => {
    renderSection();

    expect(screen.getByRole('heading', { level: 3, name: 'Section Label' })).toBeInTheDocument();
  });

  test('does not show a heading when the section has no label', () => {
    section.details.label = '';

    renderSection();

    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  test('pairs every field label with its value in a definition list', () => {
    renderSection();

    expect(screen.getByText('Numeric Field').tagName).toBe('DT');
    expect(screen.getByText('10').tagName).toBe('DD');
  });

  test('groups consecutive fields in a single definition list', () => {
    renderSection();

    expect(screen.getByText('Numeric Field').closest('dl')).toBe(screen.getByText('Text Field').closest('dl'));
  });

  test('starts a new definition list after a header', () => {
    section.details.leftColumn = ['numeric_field', 'header-1', 'text_field'];

    renderSection();

    expect(screen.getByText('Numeric Field').closest('dl')).not.toBe(screen.getByText('Text Field').closest('dl'));
    expect(screen.getByRole('heading', { name: 'Large Header' }).closest('dl')).toBeNull();
  });

  test('shows the headers as headings themed by their size', () => {
    section.details.leftColumn = ['header-1', 'header-2'];

    renderSection();

    expect(screen.getByRole('heading', { level: 4, name: 'Large Header' })).toHaveClass('large');
    expect(screen.getByRole('heading', { level: 4, name: 'Medium Header' })).toHaveClass('medium');
  });

  test('shows a placeholder for a field the user left unanswered', () => {
    renderSection({ formData: { numeric_field: 10 } });

    expect(screen.getByText('Text Field').nextElementSibling).toHaveTextContent('-');
  });

  test('shows a placeholder for a field whose value is null', () => {
    renderSection({ formData: { numeric_field: 10, text_field: null } });

    expect(screen.getByText('Text Field').nextElementSibling).toHaveTextContent('-');
  });

  test('shows a placeholder for an empty multiple choice list', () => {
    section.details.leftColumn = ['choice_field'];

    renderSection({ formData: { choice_field: [] } });

    expect(screen.getByText('Choice Field').nextElementSibling).toHaveTextContent('-');
  });

  test('shows the fields of the right column when the section has two columns', () => {
    renderSection();

    expect(screen.getByText('Location Field')).toBeInTheDocument();
  });

  test('does not show the fields of the right column when the section has one column', () => {
    section.details.columns = 1;

    renderSection();

    expect(screen.queryByText('Location Field')).toBeNull();
  });

  test('shows location values in the given coordinates representation', () => {
    renderSection({ formData: { location_field: { latitude: 10.1234, longitude: 30.987 } } });

    expect(screen.getByText('10.123400°, 30.987000°')).toBeInTheDocument();
  });
});
