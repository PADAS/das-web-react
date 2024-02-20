import React, { useEffect } from 'react';
import { Provider } from 'react-redux';

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

    store = { data: {}, view: { userPreferences: { gpsFormat: 'DEG' } } };
  });

  test('extracts the coordinates from an array', async () => {
    render(<Provider store={mockStore(store)}>
      <FeatureSymbolPopup
        data={{ geometry: { coordinates: [0, 0] }, properties: {} }}
        id="123"
      />
    </Provider>);

    expect((await screen.findByTestId('gpsFormatToggle-gpsString'))).toHaveTextContent('0.000000°, 0.000000°');
  });

  test('extracts the coordinates from an array of arrays', async () => {
    render(<Provider store={mockStore(store)}>
      <FeatureSymbolPopup
        data={{ geometry: { coordinates: [[0, 0]] }, properties: {} }}
        id="123"
      />
    </Provider>);

    expect((await screen.findByTestId('gpsFormatToggle-gpsString'))).toHaveTextContent('0.000000°, 0.000000°');
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
