import React from 'react';
import { Provider, useSelector } from 'react-redux';

import { GPS_FORMATS } from '../utils/location';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import GearPopup from './';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const makeGear = (devices) => ({
  id: 'gear-1',
  display_id: 'Test Gear',
  type: 'trawl',
  devices,
});

const renderGearPopup = (gear, { coordinates = null } = {}) => {
  const state = {
    data: { gear: { byId: gear ? { 'gear-1': gear } : {} } },
    view: {
      coordinateReferenceSystems: {
        selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
        storedSystems: [],
      },
      userPreferences: { gpsFormat: GPS_FORMATS.DEG },
    },
  };
  useSelector.mockImplementation((fn) => fn(state));
  render(
    <Provider store={mockStore(state)}>
      <GearPopup data={{ properties: { id: 'gear-1' }, coordinates }} />
    </Provider>
  );
};

const isBefore = (a, b) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('GearPopup', () => {
  test('renders nothing when gear is not found in the store', () => {
    renderGearPopup(null);
    expect(screen.queryByTestId('gear-popup-title')).toBeNull();
  });

  test('includes manufacturer prefix in the popup title', () => {
    renderGearPopup({ ...makeGear([]), manufacturer: 'Acme' });
    expect(screen.getByTestId('gear-popup-title')).toHaveTextContent('Acme: Test Gear');
  });

  test('shows no datetime header when gear has no dates', () => {
    renderGearPopup(makeGear([{ device_id: 'd1', mfr_device_id: 'MFR-1' }]));
    expect(screen.queryByTestId('date-time')).toBeNull();
  });

  test('falls back to gear.last_updated when no device has last_deployed', () => {
    renderGearPopup({
      ...makeGear([{ device_id: 'd1', mfr_device_id: 'MFR-1' }]),
      last_updated: '2024-06-01T00:00:00Z',
    });
    expect(screen.getByTestId('date-time')).toBeInTheDocument();
  });

  test('uses device.label in the device label when present', () => {
    renderGearPopup(makeGear([
      { device_id: 'd1', mfr_device_id: 'MFR-1', label: 'Buoy Alpha' },
    ]));
    expect(screen.getByText('Device Buoy Alpha')).toBeInTheDocument();
  });

  test('falls back to device_id in the device ID span when mfr_device_id is absent', () => {
    renderGearPopup(makeGear([{ device_id: 'raw-device-id' }]));
    expect(screen.getByText('raw-device-id')).toBeInTheDocument();
  });

  test('renders GpsFormatToggle when coordinates are provided', () => {
    renderGearPopup(makeGear([]), { coordinates: [-122.4, 37.8] });
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

describe('GearPopup device sort order', () => {
  test('renders devices in ascending last_deployed order', () => {
    renderGearPopup(makeGear([
      { device_id: 'c', mfr_device_id: 'MFR-C', last_deployed: '2024-01-03T00:00:00Z' },
      { device_id: 'a', mfr_device_id: 'MFR-A', last_deployed: '2024-01-01T00:00:00Z' },
      { device_id: 'b', mfr_device_id: 'MFR-B', last_deployed: '2024-01-02T00:00:00Z' },
    ]));

    const a = screen.getByText('MFR-A');
    const b = screen.getByText('MFR-B');
    const c = screen.getByText('MFR-C');

    expect(isBefore(a, b)).toBe(true);
    expect(isBefore(b, c)).toBe(true);
  });

  test('renders devices without last_deployed after those with dates', () => {
    renderGearPopup(makeGear([
      { device_id: 'no-date', mfr_device_id: 'MFR-NO-DATE' },
      { device_id: 'dated', mfr_device_id: 'MFR-DATED', last_deployed: '2024-01-01T00:00:00Z' },
    ]));

    expect(isBefore(screen.getByText('MFR-DATED'), screen.getByText('MFR-NO-DATE'))).toBe(true);
  });

  test('preserves original order for devices with equal last_deployed', () => {
    const sameDate = '2024-01-01T00:00:00Z';
    renderGearPopup(makeGear([
      { device_id: 'first', mfr_device_id: 'MFR-FIRST', last_deployed: sameDate },
      { device_id: 'second', mfr_device_id: 'MFR-SECOND', last_deployed: sameDate },
    ]));

    expect(isBefore(screen.getByText('MFR-FIRST'), screen.getByText('MFR-SECOND'))).toBe(true);
  });

  test('renders all devices without dates in their original order', () => {
    renderGearPopup(makeGear([
      { device_id: 'x', mfr_device_id: 'MFR-X' },
      { device_id: 'y', mfr_device_id: 'MFR-Y' },
    ]));

    expect(isBefore(screen.getByText('MFR-X'), screen.getByText('MFR-Y'))).toBe(true);
  });
});
