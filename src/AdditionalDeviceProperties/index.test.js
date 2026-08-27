import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import AdditionalDeviceProperties from './';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const deviceStatusProperties = [
  { label: 'Battery', units: '%', value: 80 },
  { label: 'Model No.', units: '', value: 'Gidr1000' },
  { label: 'Favorite Color', units: '', value: 'DarkBlue' },
];

const renderProperties = (props = {}) => render(
  <AdditionalDeviceProperties deviceStatusProperties={deviceStatusProperties} {...props} />
);

beforeEach(() => window.localStorage.clear());

afterEach(() => window.localStorage.clear());

describe('AdditionalDeviceProperties', () => {
  test('renders nothing without device status properties', () => {
    const { container } = renderProperties({ deviceStatusProperties: [] });

    expect(container).toBeEmptyDOMElement();
  });

  test('lists two or fewer properties without a toggle', () => {
    renderProperties({ deviceStatusProperties: deviceStatusProperties.slice(0, 2) });

    expect(screen.getByRole('list')).toHaveTextContent('Battery');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('expands and collapses more than two properties from the toggle', async () => {
    renderProperties();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'more details >' }));

    expect(screen.getByRole('list')).toHaveTextContent('Favorite Color');

    await userEvent.click(screen.getByRole('button', { name: '< fewer details' }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('lists every property without a toggle for static subjects', () => {
    renderProperties({ isStaticSubject: true });

    expect(screen.getByRole('list')).toHaveTextContent('Favorite Color');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('replaces values with a no historical data message while the time slider is active', () => {
    renderProperties({ isStaticSubject: true, isTimeSliderActive: true });

    expect(screen.getAllByText('No historical data')).toHaveLength(deviceStatusProperties.length);
    expect(screen.queryByText(/Gidr1000/)).not.toBeInTheDocument();
  });

  test('shows the list on mount when the stored preference is on', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');

    renderProperties();

    expect(screen.getByRole('list')).toHaveTextContent('Battery');
  });

  test('stores the visibility preference when toggled', async () => {
    renderProperties();

    await userEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');

    await userEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  test('renders a placeholder rather than a bare unit for a property with no value', () => {
    renderProperties({ deviceStatusProperties: [{ label: 'Battery', units: '%', value: null }] });

    expect(screen.getByTestId('additional-props-value')).toHaveTextContent('—');
    expect(screen.getByRole('list')).not.toHaveTextContent('%');
  });

  test('renders a zero value rather than treating it as missing', () => {
    renderProperties({ deviceStatusProperties: [{ label: 'Battery', units: '%', value: 0 }] });

    expect(screen.getByTestId('additional-props-value')).toHaveTextContent('0 %');
  });

  test.each([
    ['null', null],
    ['a decoded JSON null', JSON.parse(JSON.stringify(null))],
    ['a non-array', 'not-an-array'],
  ])('renders nothing when the properties are %s', (_, deviceStatusProperties) => {
    const { container } = renderProperties({ deviceStatusProperties });

    expect(container).toBeEmptyDOMElement();
  });

  test('keeps the collapsed list in the document but out of the accessibility tree', async () => {
    renderProperties();

    expect(screen.getByTestId('additional-props')).not.toBeVisible();
    expect(document.getElementById(screen.getByRole('button').getAttribute('aria-controls')))
      .toBe(screen.getByTestId('additional-props'));

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('additional-props')).toBeVisible();
  });

  test('places the toggle before the list it controls', () => {
    renderProperties();

    const toggleButton = screen.getByRole('button');
    const list = screen.getByTestId('additional-props');

    expect(toggleButton.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('exposes the expanded state and the list controlled by the toggle', async () => {
    renderProperties();

    const toggleButton = screen.getByRole('button');

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(toggleButton.getAttribute('aria-controls')))
      .toBe(screen.getByRole('list'));
  });
});
