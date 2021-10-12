import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ErrorMessages from './ErrorMessages';

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
  render(<ErrorMessages onClose={clearErrors} errorData={ERROR_DATA} />);
});

describe('Error messages', () => {
  beforeEach(async () => {
    render(<ErrorMessages onClose={clearErrors} errorData={ERROR_DATA} />);
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
    const detailsButton = await screen.getByTestId('error-details-btn');
    let notExpandedAccordion = screen.getByRole('menuitem', { expanded: false });
    expect(notExpandedAccordion).toBeTruthy();

    userEvent.click(detailsButton);

    const expandedAccordion = screen.getByRole('menuitem', { expanded: true });
    expect(expandedAccordion).toBeTruthy();

    userEvent.click(detailsButton);
    notExpandedAccordion = screen.getByRole('menuitem', { expanded: false });
    expect(notExpandedAccordion).toBeTruthy();
  });

  test('clicking on close icon should dismiss the alert', () => {
    const errorAlert = screen.getByTestId('errors-alert');
    const closeButton = within(errorAlert).getAllByRole('button');

    userEvent.click(closeButton[0]);

    expect(clearErrors).toHaveBeenCalledTimes(1);

  });
});
