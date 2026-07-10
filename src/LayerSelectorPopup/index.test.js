import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { __resetEventIconsForTesting, __setEventIconForTesting } from '../utils/eventMapIcons';
import { calcSvgImageIconId } from '../utils/mapImages';
import { mockClusterLeaves } from '../__test-helpers/fixtures/clusters';
import { hidePopup } from '../ducks/popup';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';
import { uuid } from '../utils/string';

import LayerSelectorPopup from './';

jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  hidePopup: jest.fn(),
}));

describe('LayerSelectorPopup', () => {
  const onSelectSubject = jest.fn(), onSelectEvent = jest.fn(), onSelectPoint = jest.fn();
  let hidePopupMock, store;
  beforeEach(() => {
    hidePopupMock = jest.fn(() => () => {});
    hidePopup.mockImplementation(hidePopupMock);

    store = mockStore({ view: { mapImages: [] }, data: { eventStore: {}, locallyEditedEvent: null } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    __resetEventIconsForTesting();
  });

  test('does not show the search bar if there are 5 or less features', async () => {
    const data = {
      layers: mockClusterLeaves[0],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.queryByRole('searchbox')).toBeNull();
  });

  test('shows the search bar if there are more than 5 features', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.queryByRole('searchbox')).toBeDefined();
  });

  test('filters the layers shown in the list when user types in the search bar', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.findAllByRole('listitem')).toHaveLength(6);

    const searchBar = await screen.findByRole('searchbox');
    await userEvent.type(searchBar, 'Jenae One Field');

    expect(await screen.findAllByRole('listitem')).toHaveLength(4);
  });

  test('clears the filter when user presses the clear button', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const searchBar = await screen.findByRole('searchbox');
    await userEvent.type(searchBar, 'Jenae One Field');

    expect(await screen.findAllByRole('listitem')).toHaveLength(4);

    const clearButton = await screen.findByRole('button');
    await userEvent.click(clearButton);

    expect(await screen.findAllByRole('listitem')).toHaveLength(6);
  });

  test('hides the current popup and triggers onSelectSubject when user clicks a subject layer', async () => {
    const data = {
      layers: mockClusterLeaves[0],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(hidePopup).toHaveBeenCalledTimes(0);
    expect(onSelectSubject).toHaveBeenCalledTimes(0);

    const subjectLayer = (await screen.findAllByRole('listitem'))[0];
    await userEvent.click(subjectLayer);

    expect(hidePopup).toHaveBeenCalledTimes(1);
    expect(onSelectSubject).toHaveBeenCalledTimes(1);
    expect(onSelectSubject.mock.calls[0][0].layer.properties.id).toBe('78c67448-666c-4c51-8e33-e1a079e215dc');
  });

  test('hides the current popup and triggers onSelectEvent when user clicks an event layer', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(hidePopup).toHaveBeenCalledTimes(0);
    expect(onSelectEvent).toHaveBeenCalledTimes(0);

    const eventLayer = (await screen.findAllByRole('listitem'))[0];
    await userEvent.click(eventLayer);

    expect(hidePopup).toHaveBeenCalledTimes(1);
    expect(onSelectEvent).toHaveBeenCalledTimes(1);
    expect(onSelectEvent.mock.calls[0][0].layer.properties.id).toBe('60e98094-4f5d-4e91-8b7c-1cef1775109d');
  });

  test('hydrates the icon for vector-tile event features from the event store, overriding the tile\'s own bogus image', async () => {
    const eventId = 'tile-event-id';
    const imageUrl = 'https://develop.pamdas.org/static/sprite-src/jenaeonefield.svg';

    const tileEventLayer = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: eventId,
        display_title: 'k6_event_24231\nJul 03, 08:59 UTC',
        event_type: 'jenaeonefield',
        icon_id: 'jenaeonefield',
        // The vector tile's own image/image_url is not a fetchable icon URL
        // (e.g. a bogus "icon-rep-amber.svg" slug) and must not be trusted.
        image: 'https://develop.pamdas.org/static/sprite-src/jenaeonefield-rep-amber.svg',
      },
    };

    const storeEvent = {
      id: eventId,
      title: 'k6_event_24231',
      event_type: 'jenaeonefield',
      geojson: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { image: imageUrl },
      },
    };

    const tileStore = mockStore({
      view: { mapImages: [] },
      data: { eventStore: { [eventId]: storeEvent }, eventTypes: [] },
    });

    const data = {
      layers: [tileEventLayer],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={tileStore}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toBe(imageUrl);
  });

  test('falls back to the icon sprite source URL for vector-tile event features not yet in the event store', async () => {
    const eventId = 'tile-only-event-id';

    const tileEventLayer = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: eventId,
        display_title: 'k6_event_99999\nJul 03, 08:59 UTC',
        event_type: 'jenaeonefield',
        icon_id: 'jenaeonefield',
        image: 'https://develop.pamdas.org/static/sprite-src/jenaeonefield-rep-amber.svg',
      },
    };

    const tileStore = mockStore({
      view: { mapImages: [] },
      data: { eventStore: {}, eventTypes: [] },
    });

    const data = {
      layers: [tileEventLayer],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={tileStore}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toContain('/static/sprite-src/jenaeonefield.svg');
  });

  test('uses the priority-colored icon already cached in the event icon registry, when available', async () => {
    const eventId = 'tile-only-event-id';
    const coloredIconSrc = 'data:image/svg+xml;charset=utf-8,colored-icon';

    __setEventIconForTesting(calcSvgImageIconId({ icon_id: 'jenaeonefield', priority: 200 }), { src: coloredIconSrc });

    const tileEventLayer = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: eventId,
        display_title: 'k6_event_99999\nJul 03, 08:59 UTC',
        event_type: 'jenaeonefield',
        icon_id: 'jenaeonefield',
        priority: 200,
        image: 'https://develop.pamdas.org/static/sprite-src/jenaeonefield-rep-amber.svg',
      },
    };

    const tileStore = mockStore({
      view: { mapImages: [] },
      data: { eventStore: {}, eventTypes: [] },
    });

    const data = {
      layers: [tileEventLayer],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={tileStore}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toBe(coloredIconSrc);
  });

  test('falls back to the icon sprite source URL when the matching store event has no geojson yet', async () => {
    const eventId = 'store-event-without-geojson';

    const tileEventLayer = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: eventId,
        display_title: 'k6_event_11111\nJul 03, 08:59 UTC',
        event_type: 'jenaeonefield',
        icon_id: 'jenaeonefield',
        image: 'https://develop.pamdas.org/static/sprite-src/jenaeonefield-rep-amber.svg',
      },
    };

    // A store event without a `geojson` property is filtered out by
    // createFeatureCollectionFromEvents, so hydration yields nothing here.
    const storeEvent = { id: eventId, title: 'k6_event_11111', event_type: 'jenaeonefield' };

    const tileStore = mockStore({
      view: { mapImages: [] },
      data: { eventStore: { [eventId]: storeEvent }, eventTypes: [] },
    });

    const data = {
      layers: [tileEventLayer],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={tileStore}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toContain('/static/sprite-src/jenaeonefield.svg');
  });

  test('uses the cached colored icon for a hydrated store event that carries icon_id/event_type', async () => {
    const eventId = 'hydrated-event-with-icon-id';
    const coloredIconSrc = 'data:image/svg+xml;charset=utf-8,colored-icon';

    __setEventIconForTesting(calcSvgImageIconId({ icon_id: 'jenaeonefield', priority: 200 }), { src: coloredIconSrc });

    const tileEventLayer = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {
        id: eventId,
        display_title: 'k6_event_22222\nJul 03, 08:59 UTC',
        event_type: 'jenaeonefield',
        icon_id: 'jenaeonefield',
        image: 'https://develop.pamdas.org/static/sprite-src/jenaeonefield-rep-amber.svg',
      },
    };

    // Real events returned by the API carry icon_id/priority at the top
    // level, which addPropsToGeoJsonByKey flattens onto the hydrated
    // feature's properties alongside event_type.
    const storeEvent = {
      id: eventId,
      title: 'k6_event_22222',
      event_type: 'jenaeonefield',
      icon_id: 'jenaeonefield',
      priority: 200,
      geojson: {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: {},
      },
    };

    const tileStore = mockStore({
      view: { mapImages: [] },
      data: { eventStore: { [eventId]: storeEvent }, eventTypes: [] },
    });

    const data = {
      layers: [tileEventLayer],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={tileStore}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const image = await screen.findByRole('img');
    expect(image.getAttribute('src')).toBe(coloredIconSrc);
  });
});
