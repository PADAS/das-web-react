import React from 'react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { render, waitFor } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { DAS_HOST } from '../constants';
import SvgIcon, { svgCache } from './';

const mockAxiosResponse = (contentType, body) => ({
  data: body,
  headers: { 'content-type': contentType },
});

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

    test('renders an img when the server returns a non-SVG content-type (e.g. PNG)', async () => {
      axiosSpy.mockResolvedValue(mockAxiosResponse('image/png', ''));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="confiscation_rep" />);

      await waitFor(() => {
        expect(container.querySelector('img')).toBeInTheDocument();
      });
      expect(container.querySelector('img').src).toContain('confiscation_rep');
    });

    test('caches the fallback entry under the failing src so later mounts skip the dead URL', async () => {
      axiosSpy
        .mockRejectedValueOnce(new Error('404'))
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

    test('falls back to the community sprite-src generic icon when the primary fetch fails', async () => {
      axiosSpy
        .mockRejectedValueOnce(new Error('404'))
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
});
