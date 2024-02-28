import React from 'react';
import merge from 'lodash/merge';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';
import { mockStore } from '../__test-helpers/MockStore';
import { fireEvent, render, screen } from '../test-utils';

import GpsInput from '../GpsInput';

describe('GpsInput', () => {
  const onValidChange = jest.fn();
  let store;

  const renderGpsInput = (props = {}, overrideStore = {}) => render(
    <Provider store={mockStore(merge(store, overrideStore))}>
      <GpsInput onValidChange={onValidChange} {...props} />
    </Provider>
  );

  beforeEach(() => {
    store = {
      data: {},
      view: {
        userPreferences: {
          gpsFormat: Object.values(GPS_FORMATS)[0],
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not show a tooltip when hovering the input', () => {
    renderGpsInput();

    let tooltip = screen.queryByRole('tooltip');

    expect(tooltip).toBeNull();

    const gpsInput = screen.getByRole('textbox');
    userEvent.hover(gpsInput);

    tooltip = screen.queryByRole('tooltip');

    expect(tooltip).toBeNull();
  });

  test('shows a tooltip when hovering the input', () => {
    renderGpsInput({ tooltip: 'GPS input tooltip' });

    let tooltip = screen.queryByRole('tooltip');

    expect(tooltip).toBeNull();

    const gpsInput = screen.getByRole('textbox');
    userEvent.hover(gpsInput);

    tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('GPS input tooltip');
  });

  test('shows an error state in the input and does not trigger onValidChange if location is invalid', () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('textbox');

    expect(gpsInput).not.toHaveClass('error');

    userEvent.type(gpsInput, 'a');

    expect(onValidChange).toHaveBeenCalledTimes(0);
    expect(gpsInput).toHaveClass('error');
  });

  test('does not show an error and triggers onValidChange if a valid location is provided', () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('textbox');

    expect(gpsInput).not.toHaveClass('error');

    expect(onValidChange).toHaveBeenCalledTimes(0);

    userEvent.type(gpsInput, '10.0022, 10.3524');

    expect(onValidChange).toHaveBeenCalledWith([10.3524, 10.0022]);
    expect(gpsInput).not.toHaveClass('error');
  });

  test('has an initial location if provided', () => {
    renderGpsInput({ lngLat: [10.3524, 10.0022] });

    const gpsInput = screen.getByRole('textbox');

    expect(gpsInput).toHaveValue('10.002200°,  10.352400°');
  });

  test('transforms the input value into the user preferences GPS format', () => {
    renderGpsInput({ lngLat: [10.3524, 10.0022] }, {
      view: {
        userPreferences: {
          gpsFormat: Object.values(GPS_FORMATS)[2],
        },
      },
    });

    const gpsInput = screen.getByRole('textbox');

    expect(gpsInput).toHaveValue('10° 00.132000′ N, 010° 21.144000′ E');
  });

  test('sets the last valid location when blurring the input', () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('textbox');
    userEvent.type(gpsInput, '10.0022, 10.3524 INVALID');
    fireEvent.blur(gpsInput);

    expect(gpsInput).toHaveValue('10.002200°,  10.352400°');
  });

  test('does not show the action button', () => {
    renderGpsInput();

    const button = screen.queryByRole('button');

    expect(button).toBeNull();
  });

  test('shows the action button', () => {
    const onButtonClick = jest.fn();

    renderGpsInput({ buttonContent: 'GPS input button', onButtonClick });

    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('GPS input button');
  });

  test('triggers onButtonClick when clicking the action button', () => {
    const onButtonClick = jest.fn();

    renderGpsInput({ buttonContent: 'GPS input button', onButtonClick });

    expect(onButtonClick).toHaveBeenCalledTimes(0);

    const button = screen.getByRole('button');
    userEvent.click(button);

    expect(onButtonClick).toHaveBeenCalledTimes(1);
  });

  test('shows an usage example according to the GPS format when there are no errors in the input', () => {
    renderGpsInput();

    const textBelow = screen.getByTestId('gpsInput-textBelow');

    expect(textBelow).toHaveTextContent('Example: -0.15293, 37.30906');
  });

  test('shows an error message when there are errors in the input', () => {
    renderGpsInput();

    const gpsInput = screen.getByRole('textbox');
    userEvent.type(gpsInput, 'error');

    const textBelow = screen.getByTestId('gpsInput-textBelow');

    expect(textBelow).toHaveTextContent('Invalid location');
  });
});
