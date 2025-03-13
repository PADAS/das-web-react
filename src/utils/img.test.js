import { imgElFromSrc, calcImgIdFromUrlForMapImages, calcUrlForImage } from './img';

// Mock global objects
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('img utility functions', () => {
  describe('calcUrlForImage', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('returns null for null input', () => {
      expect(calcUrlForImage(null)).toBeNull();
    });

    it('returns the original URL if it already has a host', () => {
      const url = 'https://example.com/image.jpg';
      expect(calcUrlForImage(url)).toBe(url);
    });

    it('returns the original URL if it is a data URL', () => {
      const url = 'data:image/png;base64,abc123';
      expect(calcUrlForImage(url)).toBe(url);
    });

    it('returns the original URL if it is from static media', () => {
      const url = '/static/media/image.jpg';
      const cleaned = calcUrlForImage(url);

      expect(cleaned).toBe(url);
    });

    it('appends host to URL that needs it', () => {
      const url = 'images/test.jpg';
      const cleaned = calcUrlForImage(url);
      expect(cleaned).toBe(`https://localhost/${url}`);
    });
  });

  describe('calcImgIdFromUrlForMapImages', () => {
    it('calculates image ID with just src', () => {
      const src = 'images/test.jpg';
      const expectedUrl = calcUrlForImage(src);
      expect(calcImgIdFromUrlForMapImages(src)).toBe(`${expectedUrl}-x-x`);
    });

    it('calculates image ID with src and width', () => {
      const src = 'images/test.jpg';
      const width = 100;
      const expectedUrl = calcUrlForImage(src);
      expect(calcImgIdFromUrlForMapImages(src, width)).toBe(`${expectedUrl}-${width}-x`);
    });

    it('calculates image ID with src, width, and height', () => {
      const src = 'images/test.jpg';
      const width = 100;
      const height = 200;
      const expectedUrl = calcUrlForImage(src);
      expect(calcImgIdFromUrlForMapImages(src, width, height)).toBe(`${expectedUrl}-${width}-${height}`);
    });
  });

  describe('imgElFromSrc', () => {
    let mockImage;
    let loadCallback;
    let errorCallback;

    beforeEach(() => {
      // Mock Image constructor
      mockImage = {
        setAttribute: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') loadCallback = callback;
        }),
        onerror: null,
        naturalWidth: 100,
        naturalHeight: 50,
        width: 0,
        height: 0,
        src: '',
      };

      global.Image = jest.fn(() => mockImage);
      global.URL.revokeObjectURL.mockClear();
    });

    it('creates an image element with crossorigin attribute', async () => {
      const loadPromise = imgElFromSrc('test.jpg');
      expect(mockImage.setAttribute).toHaveBeenCalledWith('crossorigin', 'anonymous');

      // Simulate successful load
      loadCallback();
      await loadPromise;
    });

    it('sets width and height if both are provided', async () => {
      const loadPromise = imgElFromSrc('test.jpg', 200, 100);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(200);
      expect(img.height).toBe(100);
    });

    it('calculates dimensions based on width if only width is provided', async () => {
      mockImage.naturalWidth = 200;
      mockImage.naturalHeight = 100;

      const loadPromise = imgElFromSrc('test.jpg', 50);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(50);
      expect(img.height).toBe(25); // 50 * (100/200)
    });

    it('calculates dimensions based on height if only height is provided', async () => {
      mockImage.naturalWidth = 100;
      mockImage.naturalHeight = 200;

      const loadPromise = imgElFromSrc('test.jpg', null, 50);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(25); // 50 * (100/200)
      expect(img.height).toBe(50);
    });

    it('handles case when natural dimensions are not available', async () => {
      mockImage.naturalWidth = 0;
      mockImage.naturalHeight = 0;

      const loadPromise = imgElFromSrc('test.jpg', 50);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(50);
      expect(img.height).toBe(50);
    });

    it('revokes object URLs after load', async () => {
      const objectURL = 'blob:https://example.com/1234-5678';
      const loadPromise = imgElFromSrc(objectURL, 50);

      // Simulate successful load
      loadCallback();
      await loadPromise;

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(objectURL);
    });

    it('revokes object URLs on error', async () => {
      const objectURL = 'blob:https://example.com/1234-5678';
      const loadPromise = imgElFromSrc(objectURL, 50);

      // Set up error handler
      expect(mockImage.onerror).toBeDefined();

      // Simulate error
      mockImage.onerror(new Error('test error'));

      await expect(loadPromise).rejects.toEqual('could not load image');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(objectURL);
    });

    it('does not revoke regular URLs', async () => {
      const regularURL = 'https://example.com/image.jpg';
      const loadPromise = imgElFromSrc(regularURL, 50);

      // Simulate successful load
      loadCallback();
      await loadPromise;

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });
});
