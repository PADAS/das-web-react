import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';

import Section from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Section', () => {
  const focusLocationMarker = jest.fn();
  const onFieldChange = jest.fn();
  const onFieldErrorsChange = jest.fn();
  const renderFormElement = jest.fn();
  const setDefaultFormData = jest.fn();

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
    focusLocationMarker={focusLocationMarker}
    formData={{ 'text-1': 'Value 1' }}
    formElements={{
      'text-1': {
        details: {
          defaultInput: 'Default Value 1',
          value: 'text-1',
        },
      },
    }}
    hidden={false}
    id="section-1"
    onFieldChange={onFieldChange}
    onFieldErrorsChange={onFieldErrorsChange}
    renderFormElement={renderFormElement}
    setDefaultFormData={setDefaultFormData}
    {...props}
  />);

  test('does not set the default form data for sections that are not hidden', async () => {
    const { rerender } = renderSectionField();

    expect(setDefaultFormData).not.toHaveBeenCalled();

    rerender(<Section
      details={details}
      fieldErrors={{}}
      focusLocationMarker={focusLocationMarker}
      formData={{ 'text-1': 'Value 1' }}
      formElements={{
        'text-1': {
          details: {
            defaultInput: 'Default Value 1',
            value: 'text-1',
          },
        },
      }}
      hidden={false}
      id="section-1"
      onFieldChange={onFieldChange}
      onFieldErrorsChange={onFieldErrorsChange}
      renderFormElement={renderFormElement}
      setDefaultFormData={setDefaultFormData}
    />);

    expect(setDefaultFormData).not.toHaveBeenCalled();
  });

  test('does not set the default form data for sections that remain hidden', async () => {
    const { rerender } = renderSectionField({ hidden: true });

    expect(setDefaultFormData).not.toHaveBeenCalled();

    rerender(<Section
      details={details}
      fieldErrors={{}}
      focusLocationMarker={focusLocationMarker}
      formData={{ 'text-1': 'Value 1' }}
      formElements={{
        'text-1': {
          details: {
            defaultInput: 'Default Value 1',
            value: 'text-1',
          },
        },
      }}
      hidden={true}
      id="section-1"
      onFieldChange={onFieldChange}
      onFieldErrorsChange={onFieldErrorsChange}
      renderFormElement={renderFormElement}
      setDefaultFormData={setDefaultFormData}
    />);

    expect(setDefaultFormData).not.toHaveBeenCalled();
  });

  test('does not set the default form data if the section children do not have default inputs', async () => {
    const { rerender } = renderSectionField({
      formElements: {
        'text-1': {
          details: {
            defaultInput: '',
          },
        },
      },
      hidden: true,
    });

    expect(setDefaultFormData).not.toHaveBeenCalled();

    rerender(<Section
      details={details}
      fieldErrors={{}}
      focusLocationMarker={focusLocationMarker}
      formData={{ 'text-1': 'Value 1' }}
      formElements={{
        'text-1': {
          details: {
            defaultInput: '',
            value: 'text-1',
          },
        },
      }}
      hidden={false}
      id="section-1"
      onFieldChange={onFieldChange}
      onFieldErrorsChange={onFieldErrorsChange}
      renderFormElement={renderFormElement}
      setDefaultFormData={setDefaultFormData}
    />);

    expect(setDefaultFormData).not.toHaveBeenCalled();
  });

  test('sets the default form data for sections that were hidden and become visible', async () => {
    const { rerender } = renderSectionField({ hidden: true });

    expect(setDefaultFormData).not.toHaveBeenCalled();

    rerender(<Section
      details={details}
      fieldErrors={{}}
      focusLocationMarker={focusLocationMarker}
      formData={{ 'text-1': 'Value 1' }}
      formElements={{
        'text-1': {
          details: {
            defaultInput: 'Default Value 1',
            value: 'text-1',
          },
        },
      }}
      hidden={false}
      id="section-1"
      onFieldChange={onFieldChange}
      onFieldErrorsChange={onFieldErrorsChange}
      renderFormElement={renderFormElement}
      setDefaultFormData={setDefaultFormData}
    />);

    expect(setDefaultFormData).toHaveBeenCalledTimes(1);
    expect(setDefaultFormData).toHaveBeenCalledWith({ 'text-1': 'Default Value 1' });
  });

  test('does not show a header if the label is not defined', async () => {
    details.label = '';
    renderSectionField();

    expect(screen.queryByRole('heading')).toBeNull();
  });

  test('shows the header if the labes is defined', async () => {
    renderSectionField();

    expect(screen.getByRole('heading')).toHaveTextContent('Section 1 Label');
  });

  test('shows the left column when it is the only column', async () => {
    details.columns = 1;
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('fullWidth');
  });

  test('shows the left column when there are two columns', async () => {
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('halfWidthLeft');
  });

  test('does not show the right column if the section has one column', async () => {
    details.columns = 1;
    renderSectionField();

    expect(screen.queryByTestId('schema-form-section-section-1-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', async () => {
    renderSectionField();

    expect(screen.getByTestId('schema-form-section-section-1-right-column')).toBeVisible();
  });

  test('renders the children', async () => {
    renderSectionField();

    expect(renderFormElement).toHaveBeenCalledTimes(1);
    expect(renderFormElement.mock.calls[0][0]).toBe('text-1');
    expect(renderFormElement.mock.calls[0][1]).toBe('Value 1');
    expect(renderFormElement.mock.calls[0][3]).toBe(undefined);
    expect(renderFormElement.mock.calls[0][4]).toBe(focusLocationMarker);
  });

  test('applies changes in values and errors from the children', async () => {
    renderFormElement.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderSectionField({ fieldErrors: { 'text-1': { message: 'Error' } } });

    expect(onFieldChange).not.toHaveBeenCalled();
    expect(onFieldErrorsChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByTestId('text-1'), 'a');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'Value 1a');
    expect(onFieldErrorsChange).toHaveBeenCalledTimes(1);
    expect(onFieldErrorsChange).toHaveBeenCalledWith({ 'text-1': undefined });
  });
});
