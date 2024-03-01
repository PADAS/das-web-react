import React from 'react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import { render } from '../test-utils';

import MapImagesLayer from './';

test('rendering without crashing', () => {
  render(<Provider store={mockStore({ view: { mapImages: { } } })}>
    <MapContext.Provider value={createMapMock()}>
      <MapImagesLayer />
    </MapContext.Provider>
  </Provider>);
});

describe('adding images to the map', () => {
  let map;

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

    render(<Provider store={mockStore(() => state)}>
      <MapContext.Provider value={map}>
        <MapImagesLayer />
      </MapContext.Provider>
    </Provider>);

    expect(map.addImage).toHaveBeenCalledWith('id1', state.view.mapImages.id1.image, state.view.mapImages.id1.options);
    expect(map.addImage).toHaveBeenCalledWith('id2', state.view.mapImages.id2.image, state.view.mapImages.id2.options);
  });

  test('not adding previously-loaded images', () => {
    map.hasImage.mockImplementation((id) => id === EXISTING_IMG_ID);

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

    render(<Provider store={mockStore(() => state)}>
      <MapContext.Provider value={map}>
        <MapImagesLayer map={map} />
      </MapContext.Provider>
    </Provider>);

    expect(map.addImage).toHaveBeenCalledWith('id2', state.view.mapImages.id2.image, state.view.mapImages.id2.options);
    expect(map.addImage).not.toHaveBeenCalledWith(EXISTING_IMG_ID, state.view.mapImages[EXISTING_IMG_ID].image, state.view.mapImages[EXISTING_IMG_ID].options);
  });
});
