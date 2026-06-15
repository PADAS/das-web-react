import React from 'react';
import { render, screen, waitFor } from '../test-utils';
import SvgIcon, { svgCache } from './';

const mockFetch = (contentType, body) =>
  jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => contentType },
    text: () => Promise.resolve(body),
  });

describe('SvgIcon', () => {
  let fetchSpy;

  beforeEach(() => {
    svgCache.clear();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('event icons', () => {
    test('renders inline SVG when the server returns an SVG content-type', async () => {
      fetchSpy.mockImplementation(mockFetch('image/svg+xml', '<svg><path d="M0 0"/></svg>'));

      render(<SvgIcon type="events" iconId="fire_rep" />);

      await waitFor(() => {
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
    });

    test('renders an img when the server returns a non-SVG content-type (e.g. PNG)', async () => {
      fetchSpy.mockImplementation(mockFetch('image/png', ''));

      const { container } = render(<SvgIcon type="events" iconId="confiscation_rep" />);

      await waitFor(() => {
        expect(container.querySelector('img')).toBeInTheDocument();
      });
      expect(container.querySelector('img').src).toContain('confiscation_rep');
    });
  });

  describe('subject icons', () => {
    test('renders an img for SVG subject image URLs', () => {
      render(<SvgIcon type="subjects" imageUrl="https://example.com/subject.svg" />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.svg');
    });

    test('renders an img for PNG subject image URLs', () => {
      render(<SvgIcon type="subjects" imageUrl="https://example.com/subject.png" />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/subject.png');
    });
  });
});
