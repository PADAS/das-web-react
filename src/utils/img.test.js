import { imgElFromSrc, calcImgIdFromUrlForMapImages, calcUrlForImage, registerActiveURL } from './img';

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

        try {
          await loadPromise;
        } catch (e) {

        }

        expect(mapDeleteSpy).toHaveBeenCalled();

        mapDeleteSpy.mockRestore();
      });
    });
  });
});
