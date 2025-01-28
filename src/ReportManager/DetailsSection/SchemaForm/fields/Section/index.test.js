import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';

import Section from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Section', () => {
  const onFieldChange = jest.fn();
  const onFieldErrorsChange = jest.fn();
  const renderField = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      columns: 2,
      label: 'Section 1 Label',
      leftColumn: ['text-1'],
      rightColumn: [],
    };
  });

  const renderSectionField = (props) => render(<Section
    details={details}
    fieldErrors={{}}
    formData={{ 'text-1': 'Value 1' }}
    id="section-1"
    onFieldChange={onFieldChange}
    onFieldErrorsChange={onFieldErrorsChange}
    renderField={renderField}
    {...props}
  />);

  test('does not show a header if the label is not defined', () => {
    details.label = '';
    renderSectionField();

    expect(screen.queryByRole('heading')).toBeNull();
  });

  test('shows the header if the labes is defined', () => {
    renderSectionField();

    expect(screen.getByRole('heading')).toHaveTextContent('Section 1 Label');
  });

  test('shows the left column when it is the only column', () => {
    details.columns = 1;
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('fullWidth');
  });

  test('shows the left column when there are two columns', () => {
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('halfWidthLeft');
  });

  test('does not show the right column if the section has one column', () => {
    details.columns = 1;
    renderSectionField();

    expect(screen.queryByTestId('schema-form-section-section-1-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', () => {
    renderSectionField();

    expect(screen.getByTestId('schema-form-section-section-1-right-column')).toBeVisible();
  });

  test('renders the children', () => {
    renderSectionField();

    expect(renderField).toHaveBeenCalledTimes(1);
    expect(renderField.mock.calls[0][0]).toBe('text-1');
    expect(renderField.mock.calls[0][1]).toBe('Value 1');
    expect(renderField.mock.calls[0][3]).toBe(undefined);
  });

  test('applies changes in values and errors from the children', () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderSectionField({ fieldErrors: { 'text-1': { message: 'Error' } } });

    expect(onFieldChange).not.toHaveBeenCalled();
    expect(onFieldErrorsChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByTestId('text-1'), 'a');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'Value 1a');
    expect(onFieldErrorsChange).toHaveBeenCalledTimes(1);
    expect(onFieldErrorsChange).toHaveBeenCalledWith({ 'text-1': undefined });
  });
});
