import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import SvgIcon, { svgCache } from './';

const mockFetch = (contentType, body) =>
  jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => contentType },
    text: () => Promise.resolve(body),
  });

describe('SvgIcon', () => {
  let fetchSpy, store;

  const renderWithStore = (ui) => render(<Provider store={store}>{ui}</Provider>);

  beforeEach(() => {
    svgCache.clear();
    fetchSpy = jest.spyOn(global, 'fetch');
    store = mockStore({ data: { community: null } });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('event icons', () => {
    test('renders inline SVG when the server returns an SVG content-type', async () => {
      fetchSpy.mockImplementation(mockFetch('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
    });

    test('renders an img when the server returns a non-SVG content-type (e.g. PNG)', async () => {
      fetchSpy.mockImplementation(mockFetch('image/png', ''));

      const { container } = renderWithStore(<SvgIcon type="events" iconId="confiscation_rep" />);

      await waitFor(() => {
        expect(container.querySelector('img')).toBeInTheDocument();
      });
      expect(container.querySelector('img').src).toContain('confiscation_rep');
    });
  });

  describe('community icons', () => {
    test('fetches the extension-less community events endpoint for event icons', async () => {
      fetchSpy.mockImplementation(mockFetch('image/svg+xml', '<svg><path d="M0 0"/></svg>'));
      store = mockStore({ data: { community: { value: 'my-community' } } });

      renderWithStore(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(fetchSpy.mock.calls[0][0]).toEqual(
        expect.stringContaining('community/my-community/activity/events/eventtypes/icons/fire_rep')
      );
      expect(fetchSpy.mock.calls[0][0]).not.toContain('community/my-community/activity/events/eventtypes/icons/fire_rep.svg');
    });

    test('fetches the community sprite-src endpoint for non-event icons', async () => {
      fetchSpy.mockImplementation(mockFetch('image/svg+xml', '<svg><path d="M0 0"/></svg>'));
      store = mockStore({ data: { community: { value: 'my-community' } } });

      renderWithStore(<SvgIcon type="patrols" iconId="ranger_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
      expect(fetchSpy.mock.calls[0][0]).toEqual(
        expect.stringContaining('community/my-community/static/sprite-src/ranger_rep.svg')
      );
    });
  });

  describe('subject icons', () => {
    test('renders an img for SVG subject image URLs', () => {
      renderWithStore(<SvgIcon type="subjects" imageUrl="https://example.com/subject.svg" />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.svg');
    });

    test('renders an img for PNG subject image URLs', () => {
      renderWithStore(<SvgIcon type="subjects" imageUrl="https://example.com/subject.png" />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.png');
    });
  });
});
