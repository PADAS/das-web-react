import React from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID, TEXT_ELEMENT_INPUT_TYPES } from '../../constants';
import { render, screen } from '../../../../../test-utils';
import { SchemaFormContext } from '../../SchemaFormContext';

import Section from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Section', () => {
  const renderField = jest.fn();

  let fields;
  beforeEach(() => {
    fields = {
      'text-1': {
        details: {
          defaultInput: 'Text 1 Default Input',
          description: 'Text 1 Description',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: false,
          label: 'Text 1 Label',
          placeholder: 'Text 1 Placeholder',
          value: 'text-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['text-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    };
  });

  const renderTextField = (props, context) => {
    render(<SchemaFormContext.Provider value={{ fields, ...context }}>
      <Section id="section-1" renderField={renderField} {...props} />
    </SchemaFormContext.Provider>);
  };

  test('does not show a header if the label is not defined', () => {
    fields['section-1'].details.label = '';
    renderTextField();

    expect(screen.queryByRole('heading')).toBeNull();
  });

  test('shows the header if the labes is defined', () => {
    renderTextField();

    expect(screen.getByRole('heading')).toHaveTextContent('Section 1 Label');
  });

  test('shows the left column when it is the only column', () => {
    fields['section-1'].details.columns = 1;
    renderTextField();

    expect(screen.getByTestId('schema-form-section-section-1-left-column')).toBeVisible();
    expect(screen.getByTestId('schema-form-section-section-1-left-column')).toHaveClass('fullWidthColumn');
  });

  test('shows the left column when there are two columns', () => {
    renderTextField();

    expect(screen.getByTestId('schema-form-section-section-1-left-column')).toBeVisible();
    expect(screen.getByTestId('schema-form-section-section-1-left-column')).toHaveClass('halfWidthColumnLeft');
  });

  test('does not show the right column if the section has one column', () => {
    fields['section-1'].details.columns = 1;
    renderTextField();

    expect(screen.queryByTestId('schema-form-section-section-1-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', () => {
    renderTextField();

    expect(screen.getByTestId('schema-form-section-section-1-right-column')).toBeVisible();
  });

  test('renders the children', () => {
    renderTextField();

    expect(renderField).toHaveBeenCalledTimes(1);
    expect(renderField).toHaveBeenCalledWith('text-1');
  });
});
