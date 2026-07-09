import React from 'react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { fireEvent, render, waitFor } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { DAS_HOST } from '../constants';
import SvgIcon, { InlineSvg, svgCache } from './';

const mockAxiosResponse = (contentType, body) => ({
  data: body,
  headers: { 'content-type': contentType },
});

// A permanent client error carries a 4xx response status; transient failures (network
// error, cancellation) have no response status.
const clientError = (status = 404) => Object.assign(new Error(`${status}`), { response: { status } });

describe('SvgIcon', () => {
  let axiosSpy, store;

  const renderWithStore = (ui) => render(<Provider store={store}>{ui}</Provider>);

  beforeEach(() => {
    svgCache.clear();
    axiosSpy = jest.spyOn(axios, 'get');
    store = mockStore({ data: { community: null } });
  });

  afterEach(() => {
    axiosSpy.mockRestore();
  });

  describe('event icons', () => {
    test('renders inline SVG when the server returns an SVG content-type', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
    });

    test('colors the fill-stripped inline SVG via the color prop (fill:currentColor on the wrapper)', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path fill="#123456" d="M0 0"/></svg>'));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="fire_rep" color="rgb(4, 5, 6)" />);

      await waitFor(() => {
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      const wrapper = container.querySelector('span');
      // The wrapper drives the color: text color + fill:currentColor, so the (fill-stripped) paths inherit it.
      expect(wrapper).toHaveStyle({ color: 'rgb(4, 5, 6)', fill: 'currentColor' });
      // The hardcoded fill is stripped so nothing overrides the inherited color.
      expect(container.querySelector('path')).not.toHaveAttribute('fill');
    });

    test('renders an img when the server returns a non-SVG content-type (e.g. PNG)', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/png', ''));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="confiscation_rep" />);

      await waitFor(() => {
        expect(container.querySelector('img')).toBeInTheDocument();
      });
      expect(container.querySelector('img').src).toContain('confiscation_rep');
    });

    test('sends icon fetches with skipAuth so a 401 never triggers the logout redirect', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ skipAuth: true }));
    });

    test('caches the fallback entry under the failing src on a 4xx so later mounts skip the dead URL', async () => {
      axiosSpy
        .mockRejectedValueOnce(clientError(404))
        .mockResolvedValueOnce(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      const { unmount } = renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });

      const failingSrc = `${DAS_HOST}/static/sprite-src/fire_rep.svg`;
      expect(svgCache.has(failingSrc)).toBe(true);

      unmount();
      axiosSpy.mockClear();

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('does not cache anything on a transient failure so a later mount retries', async () => {
      // A rejection with no response status is transient (network error / cancellation).
      axiosSpy.mockRejectedValue(new Error('network down'));

      const { unmount } = renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      const failingSrc = `${DAS_HOST}/static/sprite-src/fire_rep.svg`;
      await waitFor(() => {
        expect(axiosSpy).toHaveBeenCalled();
      });
      expect(svgCache.has(failingSrc)).toBe(false);

      unmount();
      axiosSpy.mockClear();
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy).toHaveBeenCalledWith(failingSrc, expect.anything());
    });

    test('syncs cached state when a concurrent mount populates the cache after render but before the effect runs', async () => {
      const src = `${DAS_HOST}/static/sprite-src/fire_rep.svg`;
      // Initial mount with an empty cache and a transient fetch failure: `cached` stays null, so
      // this reproduces a mount whose useState captured a then-empty cache.
      axiosSpy.mockRejectedValue(new Error('network down'));

      const { container, rerender } = render(<InlineSvg src={src} repSrc={null} fallbackSrc="fallback" />);
      await waitFor(() => {
        expect(axiosSpy).toHaveBeenCalled();
      });
      expect(container.querySelector('svg')).not.toBeInTheDocument();

      // A concurrent mount's shared fetch resolves and populates the cache under the same src.
      svgCache.set(src, { svg: '<svg><path d="M0 0"/></svg>' });
      axiosSpy.mockClear();

      // The effect re-runs (a dependency changed) with the same src, so the render-phase reset does
      // not fire and `cached` is still null. The cache-hit branch must sync state from the cache
      // instead of leaving the icon blank forever.
      rerender(<InlineSvg src={src} repSrc={null} fallbackSrc="fallback2" />);

      await waitFor(() => {
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
      // It reused the cached entry rather than issuing another request.
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('falls back to the _rep icon when the primary returns 200 but unsanitizable content, and pins it under src', async () => {
      axiosSpy
        .mockResolvedValueOnce(mockAxiosResponse('image/svg+xml', '<script>alert(1)</script>'))
        .mockResolvedValueOnce(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      const { unmount } = renderWithStore(<SvgIcon type="events" iconId="fire" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      // A 200 with unsanitizable content is a permanent failure: try the primary, then _rep.
      expect(axiosSpy.mock.calls[0][0]).toBe(`${DAS_HOST}/static/sprite-src/fire.svg`);
      expect(axiosSpy.mock.calls[1][0]).toBe(`${DAS_HOST}/static/sprite-src/fire_rep.svg`);

      const failingSrc = `${DAS_HOST}/static/sprite-src/fire.svg`;
      expect(svgCache.has(failingSrc)).toBe(true);

      unmount();
      axiosSpy.mockClear();

      renderWithStore(<SvgIcon type="events" iconId="fire" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      // The _rep entry is pinned under the failing src, so a later mount skips the dead URL.
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('resets the rendered icon when src changes so the previous icon does not persist', async () => {
      axiosSpy.mockImplementation((url) => (url.includes('first_rep')
        ? Promise.resolve(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'))
        : Promise.reject(new Error('network down'))));

      const { rerender } = renderWithStore(<SvgIcon type="events" iconId="first_rep" />);
      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });

      rerender(<Provider store={store}><SvgIcon type="events" iconId="second_rep" /></Provider>);

      await waitFor(() => {
        expect(document.querySelector('svg')).not.toBeInTheDocument();
      });
    });

    test('hides a broken img and drops its cache entry so a later mount retries', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/png', ''));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="png_rep" />);
      await waitFor(() => {
        expect(container.querySelector('img')).toBeInTheDocument();
      });

      fireEvent.error(container.querySelector('img'));

      const src = `${DAS_HOST}/static/sprite-src/png_rep.svg`;
      expect(svgCache.has(src)).toBe(false);
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    test('retries the _rep variant on a 4xx before the generic fallback', async () => {
      axiosSpy
        .mockRejectedValueOnce(clientError(404))
        .mockResolvedValueOnce(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      renderWithStore(<SvgIcon type="events" iconId="fire" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy.mock.calls[0][0]).toBe(`${DAS_HOST}/static/sprite-src/fire.svg`);
      expect(axiosSpy.mock.calls[1][0]).toBe(`${DAS_HOST}/static/sprite-src/fire_rep.svg`);
    });
  });

  describe('community icons', () => {
    test('fetches the extension-less community events endpoint for event icons', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));
      store = mockStore({ data: { community: { value: 'my-community' } } });

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy.mock.calls[0][0]).toEqual(
        expect.stringContaining('community/my-community/activity/events/eventtypes/icons/fire_rep')
      );
      expect(axiosSpy.mock.calls[0][0]).not.toContain('community/my-community/activity/events/eventtypes/icons/fire_rep.svg');
    });

    test('fetches the community sprite-src endpoint for non-event icons', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));
      store = mockStore({ data: { community: { value: 'my-community' } } });

      renderWithStore(<SvgIcon type="patrols" iconId="ranger_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy.mock.calls[0][0]).toEqual(
        expect.stringContaining('community/my-community/static/sprite-src/ranger_rep.svg')
      );
    });

    test('falls back to the community sprite-src generic icon when the primary fetch 4xxs', async () => {
      axiosSpy
        .mockRejectedValueOnce(clientError(404))
        .mockResolvedValueOnce(mockAxiosResponse('image/svg+xml', '<svg><path d="M0 0"/></svg>'));
      store = mockStore({ data: { community: { value: 'my-community' } } });

      renderWithStore(<SvgIcon type="patrols" iconId="ranger_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(axiosSpy.mock.calls[1][0]).toEqual(
        expect.stringContaining('community/my-community/static/sprite-src/generic_rep.svg')
      );
    });
  });

  describe('subject icons', () => {
    test('renders an img for SVG subject image URLs', () => {
      const { container } = renderWithStore(<SvgIcon type="subjects" imageUrl="https://example.com/subject.svg" />);

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.svg');
    });

    test('renders an img for PNG subject image URLs', () => {
      const { container } = renderWithStore(<SvgIcon type="subjects" imageUrl="https://example.com/subject.png" />);

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.png');
    });

    test('exposes a title as the accessible name when provided', () => {
      const { container } = renderWithStore(
        <SvgIcon type="subjects" imageUrl="https://example.com/subject.svg" title="Elephant 01" />
      );

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('alt', 'Elephant 01');
    });
  });

  describe('sanitization', () => {
    test('strips scripts, event handlers, links, foreignObject, focusable nodes, and external image loads from crafted icons', async () => {
      const malicious = `<svg xmlns="http://www.w3.org/2000/svg">
        <script>window.__pwned = true;</script>
        <rect width="10" height="10" onload="window.__pwned = true;" />
        <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">hi<script>window.__pwned = true;</script></div></foreignObject>
        <a href="https://evil.example.com"><rect width="5" height="5" /></a>
        <rect width="3" height="3" tabindex="0" />
        <image href="https://evil.example.com/x.png" />
        <filter id="f"><feGaussianBlur stdDeviation="2" /><feImage href="https://evil.example.com/x.png" /></filter>
      </svg>`;
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/svg+xml', malicious));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      const html = container.innerHTML;
      expect(container.querySelector('script')).not.toBeInTheDocument();
      expect(container.querySelector('a')).not.toBeInTheDocument();
      expect(container.querySelector('foreignObject')).not.toBeInTheDocument();
      expect(container.querySelector('image')).not.toBeInTheDocument();
      expect(container.querySelector('[tabindex]')).not.toBeInTheDocument();
      expect(html).not.toMatch(/onload/i);
      expect(html).not.toMatch(/href/i);
      // <feImage> loads external resources like <image>, so it must be stripped too, while a
      // legitimate filter primitive survives.
      expect(html).not.toMatch(/feImage/i);
      expect(html).toMatch(/feGaussianBlur/i);
    });
  });
});
