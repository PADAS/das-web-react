import React from 'react';
import axios from 'axios';
import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { featureCollection, point } from '@turf/turf';

import { mockStore } from '../__test-helpers/MockStore';
import { calcUrlForImage, ImageCache } from '../utils/img';

import MapImageFromSvgSpriteRenderer, { calcSvgImageIconId } from './';

jest.mock('axios');

const SVG_MARKUP = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

const featureCollectionFromEvents = (events) =>
  featureCollection(events.map((event, index) => point([index, index], event)));

// Real-timer flush (rather than a fixed number of `await Promise.resolve()` chains) so tests
// don't need to hand-count microtask hops through nested async/await + reject/fallback paths.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const dispatchedIconIdsFrom = (store) => store.getActions()
  .filter((action) => action.type === 'ADD_IMAGE_TO_MAP_IF_NECESSARY')
  .map((action) => action.payload.data.icon_id);

describe('calcSvgImageIconId', () => {
  it('returns the base icon_id when no priority, height, or width are provided', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire' })).toBe('fire');
  });

  it('appends priority to the base icon_id', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 200 })).toBe('fire-200');
  });

  it('treats a priority of 0 as a meaningful value rather than omitting it', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 0 })).toBe('fire-0');
  });

  it('appends width and height when provided, alongside priority, matching the icon-image expression order', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 200, height: 32, width: 24 })).toBe('fire-200-24-32');
  });
});

describe('MapImageFromSvgSpriteRenderer', () => {
  let loadCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'warn').mockImplementation(() => {});

    ImageCache.instance = null;

    loadCallbacks = [];

    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();

    global.Image = jest.fn(() => {
      const img = {
        setAttribute: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') loadCallbacks.push(callback);
        }),
        onerror: null,
        naturalWidth: 24,
        naturalHeight: 24,
        width: 0,
        height: 0,
        src: '',
      };
      return img;
    });

    axios.get.mockResolvedValue({ data: SVG_MARKUP });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates one icon per unique icon_id instead of one per event', async () => {
    const sharedEvent = { icon_id: 'fire', priority: 200, height: 32 };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer
            eventFeatureCollection={featureCollectionFromEvents([sharedEvent, sharedEvent, sharedEvent])}
          />
        </Provider>
      );
      await flushPromises();
    });

    // three events share one icon_id, so the sprite should be fetched and rendered only once
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(global.Image).toHaveBeenCalledTimes(1);

    // icons are generated as deterministic data URIs, not Blob object URLs that would need revoking
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(global.Image.mock.results[0].value.src).toMatch(/^data:image\/svg\+xml/);

    await act(async () => {
      loadCallbacks.forEach((callback) => callback());
      await flushPromises();
    });

    expect(dispatchedIconIdsFrom(store)).toEqual([calcSvgImageIconId(sharedEvent)]);
  });

  it('does not regenerate an icon that is already present in the mapImages store', async () => {
    const event = { icon_id: 'fire', priority: 200 };
    const iconId = calcSvgImageIconId(event);
    const store = mockStore({ view: { mapImages: { [iconId]: { image: 'cached', options: {} } } } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    expect(axios.get).not.toHaveBeenCalled();
    expect(global.Image).not.toHaveBeenCalled();
  });

  it('reuses cached sprite markup across renders for a new priority variant of the same icon type', async () => {
    const store = mockStore({ view: { mapImages: {} } });
    const firstEvent = { icon_id: 'fire', priority: 200 };
    const secondEvent = { icon_id: 'fire', priority: 300 };

    const { rerender } = render(
      <Provider store={store}>
        <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([firstEvent])} />
      </Provider>
    );

    await act(async () => {
      await flushPromises();
      loadCallbacks.forEach((callback) => callback());
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([secondEvent])} />
        </Provider>
      );
      await flushPromises();
    });

    // the new priority variant shares its base icon with the already-resolved one, so its sprite
    // markup is served from spriteMarkupCache instead of triggering a second sprite fetch
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight sprite fetch across different priority variants of the same icon type', async () => {
    let resolveAxiosGet;
    axios.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveAxiosGet = resolve;
    }));

    const lowPriorityEvent = { icon_id: 'fire', priority: 100 };
    const highPriorityEvent = { icon_id: 'fire', priority: 300 };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer
            eventFeatureCollection={featureCollectionFromEvents([lowPriorityEvent, highPriorityEvent])}
          />
        </Provider>
      );
      await flushPromises();
    });

    // both variants requested the sprite before it resolved, so only one request should exist
    expect(axios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAxiosGet({ data: SVG_MARKUP });
      await flushPromises();
    });

    // each variant still gets its own rendered (differently colored) icon from the shared markup
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('renders nothing and fetches nothing when no eventFeatureCollection prop is given', async () => {
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer />
        </Provider>
      );
      await flushPromises();
    });

    expect(axios.get).not.toHaveBeenCalled();
    expect(global.Image).not.toHaveBeenCalled();
  });

  it('looks up the "generic" sprite for events with no icon_id of their own', async () => {
    const event = { priority: 200 };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/generic.svg'), expect.anything());
  });

  it('retries with a "_rep" suffix when the bare icon_id has no sprite entry, rendering the real icon ' +
    'instead of falling back to generic (mirrors DasIcon\'s header/sidebar icon resolution)', async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: SVG_MARKUP });

    const event = { icon_id: 'geofence_break', priority: 200 };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, expect.stringContaining('/geofence_break.svg'), expect.anything());
    expect(axios.get).toHaveBeenNthCalledWith(2, expect.stringContaining('/geofence_break_rep.svg'), expect.anything());

    await act(async () => {
      loadCallbacks.forEach((callback) => callback());
      await flushPromises();
    });

    expect(global.Image.mock.results[0].value.src).toMatch(/^data:image\/svg\+xml/);
    expect(dispatchedIconIdsFrom(store)).toEqual([calcSvgImageIconId(event)]);
  });

  it('does not retry with a doubled "_rep" suffix when the icon_id already ends in "_rep"', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'snare_rep', priority: 200, image: 'snare.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to the event\'s own image when the event type has no sprite entry', async () => {
    // Rejects both the bare icon_id attempt and the "_rep" suffix retry, simulating an icon_id with
    // no sprite entry under either name.
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    await act(async () => {
      loadCallbacks.forEach((callback) => callback());
      await flushPromises();
    });

    expect(global.Image).toHaveBeenCalledTimes(1);
    expect(global.Image.mock.results[0].value.src).toBe(calcUrlForImage(event.image));
    expect(dispatchedIconIdsFrom(store)).toEqual([calcSvgImageIconId(event)]);
  });

  it('does not pin a fallback for a transient failure with no readable response, leaving the icon to resolve later', async () => {
    axios.get.mockRejectedValueOnce(new Error('network error'));

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    // A transient failure (no 4xx status) must not lock in a fallback the
    // write-once store would never replace. Nothing is registered, so a later
    // render pass re-fetches once the sprite endpoint recovers.
    expect(global.Image).not.toHaveBeenCalled();
    expect(dispatchedIconIdsFrom(store)).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('failed to generate map icon from sprite'),
      expect.any(Error)
    );
  });

  it('drops the cached sprite markup when recoloring it fails, so a later variant retries the fetch', async () => {
    const firstEvent = { icon_id: 'fire', priority: 200 };
    const secondEvent = { icon_id: 'fire', priority: 300 };
    const store = mockStore({ view: { mapImages: {} } });

    const { rerender } = render(
      <Provider store={store}>
        <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([firstEvent])} />
      </Provider>
    );

    await act(async () => {
      await flushPromises();
    });

    expect(axios.get).toHaveBeenCalledTimes(1);

    // the sprite fetch succeeded (markup cached), but recoloring it into an image failed
    await act(async () => {
      const [coloredImage] = global.Image.mock.results.map((result) => result.value);
      coloredImage.onerror(new Error('recolor failed'));
      await flushPromises();
    });

    await act(async () => {
      rerender(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([secondEvent])} />
        </Provider>
      );
      await flushPromises();
    });

    // a fresh fetch means the bad cache entry was dropped rather than reused for the new priority variant
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('uses the vector-tile image path as-is for the fallback, without guessing at a different path', async () => {
    // Rejects both the bare icon_id attempt and the "_rep" suffix retry, simulating an icon_id with
    // no sprite entry under either name.
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = {
      icon_id: 'hydrophone_detection',
      priority: 300,
      color: 'red',
      image: '/static/hydrophone_detection-red.svg',
    };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    expect(global.Image.mock.results[0].value.src).toBe(calcUrlForImage(event.image));
  });

  it('falls back to the generic per-color icon when the event\'s own fallback image also fails to load, so the map is never left with a permanently broken icon', async () => {
    // Rejects both the bare icon_id attempt and the "_rep" suffix retry, simulating an icon_id with
    // no sprite entry under either name.
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    await act(async () => {
      const [fallbackImage] = global.Image.mock.results.map((result) => result.value);
      fallbackImage.onerror(new Error('fallback image failed'));
      await flushPromises();
    });

    expect(global.Image).toHaveBeenCalledTimes(2);
    // priority 100 with no explicit `color` maps to the backend's "med_green" name
    expect(global.Image.mock.results[1].value.src).toBe(calcUrlForImage('/static/generic-med_green.svg'));

    await act(async () => {
      loadCallbacks.forEach((callback) => callback());
      await flushPromises();
    });

    expect(dispatchedIconIdsFrom(store)).toEqual([calcSvgImageIconId(event)]);
  });

  it('uses the tile-provided color for the generic fallback when the event carries one', async () => {
    // Rejects both the bare icon_id attempt and the "_rep" suffix retry, simulating an icon_id with
    // no sprite entry under either name.
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, color: 'lt_gray', image: 'custom-marker.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    await act(async () => {
      const [fallbackImage] = global.Image.mock.results.map((result) => result.value);
      fallbackImage.onerror(new Error('fallback image failed'));
      await flushPromises();
    });

    expect(global.Image.mock.results[1].value.src).toBe(calcUrlForImage('/static/generic-lt_gray.svg'));
  });

  it('logs a warning when the event\'s own fallback image and the generic per-color fallback both fail to load', async () => {
    // Rejects both the bare icon_id attempt and the "_rep" suffix retry, simulating an icon_id with
    // no sprite entry under either name.
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const store = mockStore({ view: { mapImages: {} } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MapImageFromSvgSpriteRenderer eventFeatureCollection={featureCollectionFromEvents([event])} />
        </Provider>
      );
      await flushPromises();
    });

    await act(async () => {
      const [fallbackImage] = global.Image.mock.results.map((result) => result.value);
      fallbackImage.onerror(new Error('fallback image failed'));
      await flushPromises();
    });

    await act(async () => {
      const [, genericFallbackImage] = global.Image.mock.results.map((result) => result.value);
      genericFallbackImage.onerror(new Error('generic fallback image failed'));
      await flushPromises();
    });

    expect(console.warn).toHaveBeenCalledWith('map icon fallback image failed to load', expect.any(String));
    expect(dispatchedIconIdsFrom(store)).toEqual([]);
  });
});
