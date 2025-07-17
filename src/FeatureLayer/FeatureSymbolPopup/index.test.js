import React, { useEffect } from 'react';
import { Provider } from 'react-redux';

import { GPS_FORMATS } from '../../utils/location';

import AddItemButton from '../../AddItemButton';
import FeatureSymbolPopup from './';
import { hidePopup } from '../../ducks/popup';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';

jest.mock('../../AddItemButton', () => jest.fn());

jest.mock('../../ducks/popup', () => ({
  ...jest.requireActual('../../ducks/popup'),
  hidePopup: jest.fn(),
}));

describe('FeatureLayer - FeatureSymbolPopup', () => {
  let AddItemButtonMock, hidePopupMock, store;
  beforeEach(() => {
    AddItemButtonMock = jest.fn(() => <button data-testid="addItemButton-button" />);
    AddItemButton.mockImplementation(AddItemButtonMock);
    hidePopupMock = jest.fn(() => () => {});
    hidePopup.mockImplementation(hidePopupMock);

    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedSystems: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  test('extracts the coordinates from an array', () => {
    render(<Provider store={mockStore(store)}>
      <FeatureSymbolPopup
        data={{ geometry: { coordinates: [0, 0] }, properties: {} }}
        id="123"
      />
    </Provider>);

    expect(screen.getByText('0.000000°, 0.000000°')).toBeVisible();
  });

  test('extracts the coordinates from an array of arrays', async () => {
    render(<Provider store={mockStore(store)}>
      <FeatureSymbolPopup
        data={{ geometry: { coordinates: [[0, 0]] }, properties: {} }}
        id="123"
      />
    </Provider>);

    expect(screen.getByText('0.000000°, 0.000000°')).toBeVisible();
  });

  test('hides the popup once the addition of a report completes', async () => {
    AddItemButtonMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddItemButton.mockImplementation(AddItemButtonMock);

    expect(hidePopup).toHaveBeenCalledTimes(0);

    render(<Provider store={mockStore(store)}>
      <FeatureSymbolPopup
        data={{ geometry: { coordinates: [[0, 0]] }, properties: {} }}
        id="123"
      />
    </Provider>);

    expect(hidePopup).toHaveBeenCalledTimes(1);
  });
});
