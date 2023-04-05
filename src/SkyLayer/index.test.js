import React from 'react';
import { Provider } from 'react-redux';
import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { render } from '@testing-library/react';

import SkyLayer, { DEFAULT_SKY_LAYER_CONFIG } from './';

describe('the sky layer', () => {
  let map, store, Wrapper, renderwithWrapper;


  beforeEach(() => {
    store = {
      view: {
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
      },
    };
    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <Provider store={mockStore(store)}>
        {children}
      </Provider>;
    map = createMapMock({ getLayer: jest.fn().mockImplementation(() => null) });
    renderwithWrapper = (Component) => render(Component, { wrapper: Wrapper });
  });


  test('adding a sky layer to the map', () => {
    renderwithWrapper( <SkyLayer map={map} />);

    expect(map.addLayer).toHaveBeenCalledWith(DEFAULT_SKY_LAYER_CONFIG);

  });
});