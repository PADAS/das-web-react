import { imgElFromSrc, calcImgIdFromUrlForMapImages, calcUrlForImage, ImageCache } from './img';

const { createObjectURL, revokeObjectURL } = URL;

afterAll(() => {
  Object.assign(URL, { createObjectURL, revokeObjectURL });
});

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('img utility functions', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

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

    it('returns the original URL if it is protocol relative', () => {
      const url = '//cdn.example.com/image.jpg';
      expect(calcUrlForImage(url)).toBe(url);
    });

    it('returns the original URL if it is an object URL', () => {
      const url = 'blob:https://localhost/9a4f0e2c-1b3d-4c5e-8f7a-6b2d0e1c3a5f';
      expect(calcUrlForImage(url)).toBe(url);
    });

    it('returns the original URL if it is a bundled app asset', () => {
      const url = '/assets/location-dot-blue-abc123.png';
      const cleaned = calcUrlForImage(url);

      expect(cleaned).toBe(url);
    });

    it('returns the original URL if it is a bundled app asset in dev mode', () => {
      const url = '/src/common/images/icons/location-dot-blue.png';
      const cleaned = calcUrlForImage(url);

      expect(cleaned).toBe(url);
    });

    it('prepends host to /src/ paths when not in dev', () => {
      const prevDev = process.env.DEV;
      process.env.DEV = '';
      try {
        const url = '/src/common/images/icons/photo.png';
        const cleaned = calcUrlForImage(url);
        expect(cleaned).toBe('https://localhost/src/common/images/icons/photo.png');
      } finally {
        process.env.DEV = prevDev;
      }
    });

    it('appends host to URL that needs it', () => {
      const url = 'images/test.jpg';
      const cleaned = calcUrlForImage(url);
      expect(cleaned).toBe(`https://localhost/${url}`);
    });

    it('appends host to an absolute path without doubling the slash', () => {
      expect(calcUrlForImage('/api/v1.0/activity/event/1234/file/5678/icon/image.png'))
        .toBe('https://localhost/api/v1.0/activity/event/1234/file/5678/icon/image.png');
    });

    it('appends host to a path whose filename contains a scheme-like word', () => {
      expect(calcUrlForImage('/api/v1.0/activity/event/1234/file/5678/icon/http.png'))
        .toBe('https://localhost/api/v1.0/activity/event/1234/file/5678/icon/http.png');
    });

    it('appends a host configured with a trailing slash without doubling the slash', () => {
      jest.isolateModules(() => {
        jest.doMock('../constants', () => ({ DAS_HOST: 'https://site.pamdas.org/' }));

        const { calcUrlForImage: calcUrlForImageWithTrailingSlashHost } = require('./img');

        expect(calcUrlForImageWithTrailingSlashHost('/static/photo.png'))
          .toBe('https://site.pamdas.org/static/photo.png');
      });
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

    beforeEach(() => {

      mockImage = {
        setAttribute: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') loadCallback = callback;
        }),
        onerror: jest.fn(),
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


      loadCallback();
      await loadPromise;
    });

    it('sets width and height based on baseUnit', async () => {
      const loadPromise = imgElFromSrc('test.jpg', 200);

      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(200);
      expect(img.height).toBe(100);
    });

    it('calculates dimensions based on width if only width is provided', async () => {
      mockImage.naturalWidth = 200;
      mockImage.naturalHeight = 100;

      const loadPromise = imgElFromSrc('test.jpg', 50);


      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(50);
      expect(img.height).toBe(25);
    });

    it('handles case when natural dimensions are not available', async () => {
      const uniqueSrc = `test-no-dimensions-${Date.now()}.jpg`;

      mockImage.naturalWidth = 0;
      mockImage.naturalHeight = 0;

      const loadPromise = imgElFromSrc(uniqueSrc, 50);

      loadCallback();
      const img = await loadPromise;

      expect(img.width).toBe(50);
      expect(img.height).toBe(50);
    });

    it('revokes object URLs for images that fail to load', async () => {
      const testSrc = 'blob:https://example.com/image-error.jpg';
      global.URL.revokeObjectURL.mockClear();

      imgElFromSrc(testSrc, 50).catch(() => console.info('caught the error as i should'));

      expect(mockImage.src).toBe(testSrc);

      mockImage.onerror(new Error('image loading failed'));

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(testSrc);
    });

    describe('memoization', () => {
      it('returns cached promise for identical requests', async () => {
        const src = 'https://example.com/image.jpg';
        const width = 50;
        const promise1 = imgElFromSrc(src, width);
        const promise2 = imgElFromSrc(src, width);

        expect(promise1).toBe(promise2);

        loadCallback();
        await promise1;
      });

      it('creates new promise for different image sources', async () => {
        const promise1 = imgElFromSrc('image1.jpg', 50);
        const promise2 = imgElFromSrc('image2.jpg', 50);

        expect(promise1).not.toBe(promise2);

        loadCallback();

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

        expect(promise1).not.toBe(promise2);

        loadCallback();

        const secondImage = global.Image.mock.results[1].value;
        const secondLoadCallback = secondImage.addEventListener.mock.calls.find(
          call => call[0] === 'load'
        )[1];
        secondLoadCallback();

        await Promise.all([promise1, promise2]);
      });

      it('removes failed requests from cache', async () => {
        const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

        const loadPromise = imgElFromSrc('broken-image.jpg', 50);

        mockImage.onerror(new Error('test error'));

        await expect(loadPromise).rejects.toBeDefined();

        expect(mapDeleteSpy).toHaveBeenCalled();

        mapDeleteSpy.mockRestore();
      });
    });
  });

  describe('ImageCache', () => {
    let cache;

    beforeEach(() => {
      // Reset singleton instance before each test
      ImageCache.instance = null;
      cache = ImageCache.getInstance();
    });

    afterEach(() => {
      // Clean up singleton instance after each test
      if (cache) {
        cache.clear();
      }
      ImageCache.instance = null;
    });

    describe('singleton pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const instance1 = ImageCache.getInstance();
        const instance2 = ImageCache.getInstance();

        expect(instance1).toBe(instance2);
        expect(instance1).toBe(cache);
      });

      it('should create a new instance when existing instance is cleared', () => {
        const firstInstance = ImageCache.getInstance();
        ImageCache.instance = null;
        const secondInstance = ImageCache.getInstance();

        expect(firstInstance).not.toBe(secondInstance);
      });
    });

    describe('cache key generation', () => {
      it('should generate consistent cache keys for same parameters', () => {
        const key1 = cache.generateCacheKey('test.jpg', 100, 200);
        const key2 = cache.generateCacheKey('test.jpg', 100, 200);

        expect(key1).toBe(key2);
        expect(key1).toBe('test.jpg:100:200');
      });

      it('should handle null and undefined values correctly', () => {
        const keyWithNull = cache.generateCacheKey('test.jpg', null, undefined);
        expect(keyWithNull).toBe('test.jpg:null:undefined');
      });

      it('should generate different keys for different parameters', () => {
        const key1 = cache.generateCacheKey('test.jpg', 100, 200);
        const key2 = cache.generateCacheKey('test.jpg', 150, 200);
        const key3 = cache.generateCacheKey('other.jpg', 100, 200);

        expect(key1).not.toBe(key2);
        expect(key1).not.toBe(key3);
        expect(key2).not.toBe(key3);
      });
    });

    describe('failure tracking', () => {
      const testKey = 'test-failure-key';

      it('should start with zero failures for new keys', () => {
        expect(cache.getFailureCount(testKey)).toBe(0);
        expect(cache.hasExceededMaxFailures(testKey)).toBe(false);
      });

      it('should increment failure count correctly', () => {
        expect(cache.incrementFailureCount(testKey)).toBe(1);
        expect(cache.getFailureCount(testKey)).toBe(1);

        expect(cache.incrementFailureCount(testKey)).toBe(2);
        expect(cache.getFailureCount(testKey)).toBe(2);
      });

      it('should detect when max failures exceeded', () => {
        // Default maxFailures is 3
        cache.incrementFailureCount(testKey); // 1
        cache.incrementFailureCount(testKey); // 2
        expect(cache.hasExceededMaxFailures(testKey)).toBe(false);

        cache.incrementFailureCount(testKey); // 3
        expect(cache.hasExceededMaxFailures(testKey)).toBe(true);
      });

      it('should clear failure count', () => {
        cache.incrementFailureCount(testKey);
        cache.incrementFailureCount(testKey);
        expect(cache.getFailureCount(testKey)).toBe(2);

        cache.clearFailureCount(testKey);
        expect(cache.getFailureCount(testKey)).toBe(0);
      });
    });

    describe('image cache operations', () => {
      const testKey = 'test-image-key';
      const testPromise = Promise.resolve(new Image());

      it('should store and retrieve cached promises', () => {
        expect(cache.has(testKey)).toBe(false);
        expect(cache.get(testKey)).toBeUndefined();

        cache.set(testKey, testPromise);

        expect(cache.has(testKey)).toBe(true);
        expect(cache.get(testKey)).toBe(testPromise);
      });

      it('should delete cached entries', () => {
        cache.set(testKey, testPromise);
        expect(cache.has(testKey)).toBe(true);

        cache.delete(testKey);
        expect(cache.has(testKey)).toBe(false);
      });

      it('should clear all cached entries', () => {
        cache.set('key1', testPromise);
        cache.set('key2', testPromise);
        cache.incrementFailureCount('failed-key');

        expect(cache.has('key1')).toBe(true);
        expect(cache.has('key2')).toBe(true);
        expect(cache.getFailureCount('failed-key')).toBe(1);

        cache.clear();

        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(false);
        expect(cache.getFailureCount('failed-key')).toBe(0);
      });
    });

    describe('cache statistics', () => {
      it('should return accurate statistics', () => {
        const stats = cache.getStats();

        expect(stats.cachedImages).toBe(0);
        expect(stats.failedImages).toBe(0);
        expect(stats.failures).toEqual([]);
      });

      it('should track cached images count', () => {
        cache.set('image1', Promise.resolve());
        cache.set('image2', Promise.resolve());

        const stats = cache.getStats();
        expect(stats.cachedImages).toBe(2);
      });

      it('should track failed images and failure details', () => {
        cache.incrementFailureCount('failed1');
        cache.incrementFailureCount('failed1'); // 2 failures
        cache.incrementFailureCount('failed2'); // 1 failure

        const stats = cache.getStats();
        expect(stats.failedImages).toBe(2);
        expect(stats.failures).toEqual([
          ['failed1', 2],
          ['failed2', 1]
        ]);
      });

      it('should provide comprehensive statistics', () => {
        // Add some cached images
        cache.set('cached1', Promise.resolve());
        cache.set('cached2', Promise.resolve());

        // Add some failures
        cache.incrementFailureCount('failed1');
        cache.incrementFailureCount('failed2');
        cache.incrementFailureCount('failed2');

        const stats = cache.getStats();

        expect(stats.cachedImages).toBe(2);
        expect(stats.failedImages).toBe(2);
        expect(stats.failures).toHaveLength(2);
        expect(stats.failures).toContainEqual(['failed1', 1]);
        expect(stats.failures).toContainEqual(['failed2', 2]);
      });
    });

    describe('integration with cache operations', () => {
      it('should handle mixed operations correctly', () => {
        const cacheKey = cache.generateCacheKey('test.jpg', 100, 200);

        // Test failure tracking
        cache.incrementFailureCount(cacheKey);
        expect(cache.hasExceededMaxFailures(cacheKey)).toBe(false);

        // Test successful caching
        const testPromise = Promise.resolve(new Image());
        cache.set(cacheKey, testPromise);
        expect(cache.get(cacheKey)).toBe(testPromise);

        // Clear failure on success
        cache.clearFailureCount(cacheKey);
        expect(cache.getFailureCount(cacheKey)).toBe(0);

        // Verify stats
        const stats = cache.getStats();
        expect(stats.cachedImages).toBe(1);
        expect(stats.failedImages).toBe(0);
      });
    });
  });
});