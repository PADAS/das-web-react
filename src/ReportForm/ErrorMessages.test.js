import React from 'react';
import { render, screen } from '@testing-library/react';


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

describe('Error messages', () => {
  const clearErrors = jest.fn();

  beforeEach(async () => {
    render(<ErrorMessages onClose={clearErrors} errorData={ERROR_DATA} />);
  });

  afterEach(() => {
    clearErrors.mockClear();
  });

  test('rendering without crashing', () => {
    render(<ErrorMessages onClose={clearErrors} errorData={ERROR_DATA} />);
  });

  test('it should show the same amount of errors in the list of details', () => {
    const sortOptionsContainer = screen.queryAllByTestId('error-message');

    expect(sortOptionsContainer.length).toEqual(3);
  });

  test('The errors list should be hidden, but displayed only if the user clicks on see details', async () => {
    const detailsButton = await screen.findByTestId('error-details-btn');
    const errorsList = await screen.findByTestId('errors-details-list');

    expect(errorsList.className).toEqual(expect.stringContaining('collapse'));
    await detailsButton.click();
    expect(errorsList.className).toEqual(expect.not.stringContaining('collapse'));
  });
});
