import { imgElFromSrc, imgElFromSrcWithHeight, calcImgIdFromUrlForMapImages, calcUrlForImage } from './img';

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

    it('sets width and height based on baseUnit', async () => {
      const loadPromise = imgElFromSrc('test.jpg', 200);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      // The dimensions should be set based on the natural dimensions
      expect(img.width).toBe(200);
      expect(img.height).toBe(100); // Based on the 2:1 aspect ratio
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

      // Use the new function instead of passing a number as the third parameter
      const loadPromise = imgElFromSrcWithHeight('test.jpg', 50);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(25); // 50 * (100/200)
      expect(img.height).toBe(50);
    });

    it('handles case when natural dimensions are not available', async () => {
      // Use a unique src to avoid cache issues
      const uniqueSrc = `test-no-dimensions-${Date.now()}.jpg`;

      // Explicitly set zero dimensions
      mockImage.naturalWidth = 0;
      mockImage.naturalHeight = 0;

      const loadPromise = imgElFromSrc(uniqueSrc, 50);

      // Simulate successful load
      loadCallback();
      const img = await loadPromise;

      // Since natural dimensions are not available, both width and height
      // should be set to the baseUnit (50)
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

    // Add new tests for memoization functionality
    describe('memoization', () => {
      it('returns cached promise for identical requests', async () => {
        const src = 'https://example.com/image.jpg';
        const width = 50;

        // Updated to remove third parameter
        const promise1 = imgElFromSrc(src, width);
        const promise2 = imgElFromSrc(src, width);

        // They should be the same promise instance
        expect(promise1).toBe(promise2);

        // Complete the loading to avoid unhandled promise
        loadCallback();
        await promise1;
      });

      it('creates new promise for different image sources', async () => {
        const promise1 = imgElFromSrc('image1.jpg', 50);
        const promise2 = imgElFromSrc('image2.jpg', 50);

        // Verify they're different promises
        expect(promise1).not.toBe(promise2);

        // Complete the loading for both promises to avoid test timeouts
        loadCallback(); // This completes the first image

        // Create a new callback for the second image
        const secondImage = global.Image.mock.results[1].value;
        const secondLoadCallback = secondImage.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )[1];
        secondLoadCallback();

        await Promise.all([promise1, promise2]);
      });

      it('creates new promise for same source but different dimensions', async () => {
        const src = 'image.jpg';
        const promise1 = imgElFromSrc(src, 50);
        const promise2 = imgElFromSrc(src, 100);

        // Verify they're different promises
        expect(promise1).not.toBe(promise2);

        // Complete the loading for both promises to avoid test timeouts
        loadCallback(); // This completes the first image

        // Create a new callback for the second image
        const secondImage = global.Image.mock.results[1].value;
        const secondLoadCallback = secondImage.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )[1];
        secondLoadCallback();

        await Promise.all([promise1, promise2]);
      });

      it('removes object URLs from cache after loading', async () => {
        // We need a spy to observe Map.delete being called
        const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

        const objectURL = 'blob:https://example.com/1234-5678';
        const loadPromise = imgElFromSrc(objectURL, 50);

        // Simulate successful load
        loadCallback();
        await loadPromise;

        // Should have been removed from cache
        expect(mapDeleteSpy).toHaveBeenCalled();

        mapDeleteSpy.mockRestore();
      });

      it('removes failed requests from cache', async () => {
        const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

        const loadPromise = imgElFromSrc('broken-image.jpg', 50);

        // Simulate error
        mockImage.onerror(new Error('test error'));

        try {
          await loadPromise;
        } catch (e) {
          // Expected to reject
        }

        // Should have been removed from cache
        expect(mapDeleteSpy).toHaveBeenCalled();

        mapDeleteSpy.mockRestore();
      });

      it('limits cache size to prevent memory issues', async () => {
        // Create spy to observe cache cleanup
        const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

        // Generate 101 unique image requests to trigger cache limit
        for (let i = 0; i < 101; i++) {
          imgElFromSrc(`image${i}.jpg`, 50);
        }

        // The first image should be removed from cache when the 101st is added
        expect(mapDeleteSpy).toHaveBeenCalled();

        mapDeleteSpy.mockRestore();
      });
    });
  });
});
