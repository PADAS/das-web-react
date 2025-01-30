import React from 'react';

import { render, screen } from '../../../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../../constants';

import FormPreview from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - Item - FormPreview', () => {
  const renderFormPreview = (props) => render(<FormPreview
    errors={undefined}
    fieldIds={['field-1', 'field-2']}
    fields={{
      'field-1': {
        details: {
          label: 'Field 1',
        },
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      'field-2': {
        details: {
          label: 'Field 2',
        },
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    }}
    formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
    {...props}
  />);

  test('shows an error state if there are errors', () => {
    renderFormPreview({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).toHaveClass('error');
  });

  test('does not show an error state if there are no errors', () => {
    renderFormPreview();

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).not.toHaveClass('error');
  });

  test('shows the preview of each field with its value', () => {
    renderFormPreview();

    expect(screen.getByText('Field 1')).toBeVisible();
    expect(screen.getByText('Value 1')).toBeVisible();
    expect(screen.getByText('Field 2')).toBeVisible();
    expect(screen.getByText('Value 2')).toBeVisible();
  });

  test('shows an error state in the preview of erroneous fields', () => {
    renderFormPreview({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByText('Field 1')).toHaveClass('error');
    expect(screen.getByText('Value 1')).toHaveClass('error');
    expect(screen.getByText('Field 2')).not.toHaveClass('error');
    expect(screen.getByText('Value 2')).not.toHaveClass('error');
  });
});
