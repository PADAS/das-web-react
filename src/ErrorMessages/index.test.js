import React from 'react';
import userEvent from '@testing-library/user-event';

import ErrorMessages from './';
import { render, screen, within } from '../test-utils';

const ERROR_DATA = [{
  'name': 'required',
  'property': '.reportnationalpark_enum',
  'message': 'is a required property',
  'stack': '.reportnationalpark_enum is a required property',
  'linearProperty': [
    'reportnationalpark_enum'
  ],
  'label': 'National Park'
},
{
  'name': 'required',
  'property': '.reportinternal',
  'message': 'is a required property',
  'stack': '.reportinternal is a required property',
  'linearProperty': [
    'reportinternal'
  ],
  'label': 'TEST FieldSet Checkbox Enum from definition'
},
{
  'name': 'required',
  'property': '.blackRhinos',
  'message': 'is a required property',
  'stack': '.blackRhinos is a required property',
  'linearProperty': [
    'blackRhinos'
  ],
  'label': 'checkbox TEST with query'
}];
const clearErrors = jest.fn();

test('rendering without crashing', () => {
  render(<ErrorMessages errorData={ERROR_DATA} onClose={clearErrors} title="Error saving report." />);
});

describe('Error messages', () => {
  beforeEach(async () => {
    render(<ErrorMessages errorData={ERROR_DATA} onClose={clearErrors} title="Error saving report." />);
  });

  afterEach(() => {
    clearErrors.mockClear();
  });


  test('it should format the errors with the label of the form field followed by the error message', () => {
    const sortOptionsContainer = screen.queryAllByTestId('error-message');

    // example: "National Park: is a required property"
    expect(sortOptionsContainer[0].textContent).toEqual(`${ERROR_DATA[0].label}: ${ERROR_DATA[0].message}`);
    expect(sortOptionsContainer[1].textContent).toEqual(`${ERROR_DATA[1].label}: ${ERROR_DATA[1].message}`);
    expect(sortOptionsContainer[2].textContent).toEqual(`${ERROR_DATA[2].label}: ${ERROR_DATA[2].message}`);
  });

  test('The errors list should be hidden, but displayed only if the user clicks on see details', async () => {
    const detailsButton = await screen.findByText('See details');

    expect(detailsButton).toBeDefined();

    userEvent.click(detailsButton);

    expect(await screen.findByText('Hide details')).toBeDefined();
    expect(await screen.queryByText('See details')).toBeNull();
  });

  test('clicking on close icon should dismiss the alert', () => {
    const errorAlert = screen.getByTestId('errors-alert');
    const closeButton = within(errorAlert).getAllByRole('button');

    userEvent.click(closeButton[0]);

    expect(clearErrors).toHaveBeenCalledTimes(1);
  });

  test('should change the details copy if the list of errors is expanded', async () => {
    const detailsButton = await screen.getByText('See details', { selector: 'button' });
    expect(detailsButton).toBeDefined();

    userEvent.click(detailsButton);

    const expandedDetailsButton = await screen.getByText('Hide details', { selector: 'button' });
    expect(expandedDetailsButton).toBeDefined();
  });
});
