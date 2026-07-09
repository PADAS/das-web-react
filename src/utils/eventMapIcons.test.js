import axios from 'axios';

import { calcUrlForImage, ImageCache } from './img';
import { createMapMock } from '../__test-helpers/mocks';
import {
  __resetEventIconsForTesting,
  attachEventIconsToMap,
  ensureEventIcon,
  getEventIcon,
  subscribeEventIcons,
} from './eventMapIcons';
import { calcSvgImageIconId } from './mapImages';

jest.mock('axios');

const SVG_MARKUP = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

// Real-timer flush so the tests don't hand-count microtask hops through the
// nested async/await + reject/fallback paths.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('eventMapIcons registry', () => {
  let loadCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    __resetEventIconsForTesting();
    ImageCache.instance = null;

    loadCallbacks = [];

    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();

    global.Image = jest.fn(() => ({
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
    }));

    axios.get.mockResolvedValue({ data: SVG_MARKUP });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const fireLoads = () => loadCallbacks.forEach((callback) => callback());

  it('fetches the sprite, recolors it into a data-uri image, caches it, and notifies subscribers', async () => {
    const listener = jest.fn();
    subscribeEventIcons(listener);

    const promise = ensureEventIcon({ icon_id: 'fire', priority: 200 });
    await flushPromises();
    fireLoads();
    const image = await promise;

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(image.src).toMatch(/^data:image\/svg\+xml/);
    expect(getEventIcon(calcSvgImageIconId({ icon_id: 'fire', priority: 200 }))).toBe(image);
    expect(listener).toHaveBeenCalled();
  });

  it('strips multi-line <style> blocks from the recolored data-uri image', async () => {
    const svgWithStyle = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<style type="text/css">',
      '  path {',
      '    fill: #000;',
      '  }',
      '</style>',
      '<path d="M0 0"/>',
      '</svg>',
    ].join('\n');
    axios.get.mockResolvedValue({ data: svgWithStyle });

    const promise = ensureEventIcon({ icon_id: 'fire', priority: 200 });
    await flushPromises();
    fireLoads();
    const image = await promise;

    expect(image.src).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(image.src)).not.toContain('<style');
  });

  it('returns the cached image without refetching when the variant is already generated', async () => {
    const first = ensureEventIcon({ icon_id: 'fire', priority: 200 });
    await flushPromises();
    fireLoads();
    await first;

    axios.get.mockClear();
    global.Image.mockClear();

    const image = await ensureEventIcon({ icon_id: 'fire', priority: 200 });

    expect(axios.get).not.toHaveBeenCalled();
    expect(global.Image).not.toHaveBeenCalled();
    expect(image).toBe(getEventIcon(calcSvgImageIconId({ icon_id: 'fire', priority: 200 })));
  });

  it('dedupes an in-flight generation across concurrent callers for the same variant', async () => {
    let resolveAxiosGet;
    axios.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveAxiosGet = resolve;
    }));

    ensureEventIcon({ icon_id: 'fire', priority: 200 });
    ensureEventIcon({ icon_id: 'fire', priority: 200 });
    await flushPromises();

    expect(axios.get).toHaveBeenCalledTimes(1);

    resolveAxiosGet({ data: SVG_MARKUP });
    await flushPromises();

    expect(global.Image).toHaveBeenCalledTimes(1);
  });

  it('shares one sprite fetch across different priority variants of the same icon type', async () => {
    let resolveAxiosGet;
    axios.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveAxiosGet = resolve;
    }));

    ensureEventIcon({ icon_id: 'fire', priority: 100 });
    ensureEventIcon({ icon_id: 'fire', priority: 300 });
    await flushPromises();

    expect(axios.get).toHaveBeenCalledTimes(1);

    resolveAxiosGet({ data: SVG_MARKUP });
    await flushPromises();

    // Each variant renders its own differently-colored icon from the shared markup.
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('reuses cached sprite markup for a later variant of the same icon type', async () => {
    const first = ensureEventIcon({ icon_id: 'fire', priority: 200 });
    await flushPromises();
    fireLoads();
    await first;

    expect(axios.get).toHaveBeenCalledTimes(1);

    const second = ensureEventIcon({ icon_id: 'fire', priority: 300 });
    await flushPromises();
    fireLoads();
    await second;

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(global.Image).toHaveBeenCalledTimes(2);
  });

  it('looks up the "generic" sprite for events with no icon_id of their own', async () => {
    ensureEventIcon({ priority: 200 });
    await flushPromises();

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/generic.svg'), expect.anything());
  });

  it('retries with a "_rep" suffix when the bare icon_id has no sprite entry', async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: SVG_MARKUP });

    const promise = ensureEventIcon({ icon_id: 'geofence_break', priority: 200 });
    await flushPromises();
    fireLoads();
    const image = await promise;

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, expect.stringContaining('/geofence_break.svg'), expect.anything());
    expect(axios.get).toHaveBeenNthCalledWith(2, expect.stringContaining('/geofence_break_rep.svg'), expect.anything());
    expect(image.src).toMatch(/^data:image\/svg\+xml/);
  });

  it('does not retry with a doubled "_rep" suffix when the icon_id already ends in "_rep"', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    ensureEventIcon({ icon_id: 'snare_rep', priority: 200, image: 'snare.png' });
    await flushPromises();
    fireLoads();
    await flushPromises();

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to the event\'s own image on a permanent 4xx', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const promise = ensureEventIcon(event);
    await flushPromises();
    fireLoads();
    const image = await promise;

    expect(global.Image).toHaveBeenCalledTimes(1);
    expect(image.src).toBe(calcUrlForImage(event.image));
    expect(getEventIcon(calcSvgImageIconId(event))).toBe(image);
  });

  it('falls back to the generic per-color icon when the event\'s own image also fails to load', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const promise = ensureEventIcon(event);
    await flushPromises();

    // The event's own fallback image fails to load.
    global.Image.mock.results[0].value.onerror(new Error('fallback image failed'));
    await flushPromises();
    fireLoads();
    const image = await promise;

    expect(global.Image).toHaveBeenCalledTimes(2);
    // priority 100 with no explicit color maps to the backend's "med_green" name.
    expect(image.src).toBe(calcUrlForImage('/static/generic-med_green.svg'));
  });

  it('does not cache or notify on a transient failure, leaving the icon to resolve later', async () => {
    axios.get.mockRejectedValueOnce(new Error('network error'));
    const listener = jest.fn();
    subscribeEventIcons(listener);

    const event = { icon_id: 'custom-marker', priority: 100, image: 'custom-marker.png' };
    const image = await ensureEventIcon(event);

    expect(image).toBeUndefined();
    expect(getEventIcon(calcSvgImageIconId(event))).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('failed to generate map icon from sprite'),
      expect.any(Error)
    );

    // A later pass re-fetches rather than reusing a pinned degraded fallback.
    axios.get.mockResolvedValueOnce({ data: SVG_MARKUP });
    const retry = ensureEventIcon(event);
    await flushPromises();
    fireLoads();
    await retry;

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  describe('attachEventIconsToMap', () => {
    it('generates and registers an icon on the map for a missing event-icon id', async () => {
      const map = createMapMock();
      map.hasImage.mockReturnValue(false);

      attachEventIconsToMap(map);
      map.__test__.fireHandlers('styleimagemissing', { id: 'event-icon|fire|200' });
      await flushPromises();
      fireLoads();
      await flushPromises();

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(map.addImage).toHaveBeenCalledWith('event-icon|fire|200', expect.anything());
    });

    it('ignores ids that are not event icons', async () => {
      const map = createMapMock();

      attachEventIconsToMap(map);
      map.__test__.fireHandlers('styleimagemissing', { id: 'https://example.org/static/subject.svg' });
      await flushPromises();

      expect(axios.get).not.toHaveBeenCalled();
      expect(map.addImage).not.toHaveBeenCalled();
    });

    it('detaches the listener so later missing-image events are ignored', async () => {
      const map = createMapMock();
      const detach = attachEventIconsToMap(map);

      detach();
      map.__test__.fireHandlers('styleimagemissing', { id: 'event-icon|fire|200' });
      await flushPromises();

      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
