import React from 'react';
import { Provider } from 'react-redux';

import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';
import { render } from '@testing-library/react';

import MapImagesLayer from './';

let map, store;

test('rendering without crashing', () => {
  store = mockStore({ view: { mapImages: { } } });
  map = createMapMock();
  render(<Provider store={store}>
    <MapImagesLayer map={map} />
  </Provider>);
});

describe('adding images to the map', () => {
  beforeEach(() => {
    map = createMapMock();
  });

  test('adding new images', () => {
    map.hasImage.mockImplementation(() => false);

    const state = {
      view: {
        mapImages: {
          id1: {
            image: 'in_real_life_i_am_a_base64_string_or_HtmlImgElement',
            options: {},
          },
          id2: {
            image: 'neato',
            options: { width: 100 }
          },
        },
      }
    };

    store = mockStore(() => state);

    render(<Provider store={store}>
      <MapImagesLayer map={map} />
    </Provider>);

    expect(map.addImage).toHaveBeenCalledWith('id1', state.view.mapImages.id1.image, state.view.mapImages.id1.options);
    expect(map.addImage).toHaveBeenCalledWith('id2', state.view.mapImages.id2.image, state.view.mapImages.id2.options);
  });

  test('not adding previously-loaded images', () => {
    const EXISTING_IMG_ID = 'i_am_already_here_great';

    const state = {
      view: {
        mapImages: {
          [EXISTING_IMG_ID]: {
            image: 'in_real_life_i_am_a_base64_string_or_HtmlImgElement',
            options: { width: 0.111 },
          },
          id2: {
            image: 'yes_indeed',
            options: { height: 666 }
          }
        },
      }
    };

    store = mockStore(() => state);

    map.hasImage.mockImplementation((id) => {

      if (id === EXISTING_IMG_ID) return true;
      return false;
    });

    render(<Provider store={store}>
      <MapImagesLayer map={map} />
    </Provider>);

    expect(map.addImage).toHaveBeenCalledWith('id2', state.view.mapImages.id2.image, state.view.mapImages.id2.options);
    expect(map.addImage).not.toHaveBeenCalledWith(EXISTING_IMG_ID, state.view.mapImages[EXISTING_IMG_ID].image, state.view.mapImages[EXISTING_IMG_ID].options);
  });

});