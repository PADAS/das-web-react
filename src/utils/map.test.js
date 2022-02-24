import { createMapMock } from '../__test-helpers/mocks';

import { calculatePopoverPlacement, waitForMapBounds } from './map';

let map;
const errorObj = new Error('invalid LngLat');
// const successValue =  [[12, 21], [22, 32]];

describe('waitForMapBounds', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    map = null;
  });

  it('tries to get the map bounds immediately', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });

    map = createMapMock({ getBounds: getBoundsMock });

    waitForMapBounds(map);

    expect(map.getBounds).toHaveBeenCalledTimes(1);
  });

  it('polls at a specified interval (default 125ms) if no good value is returned initially', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });

    map = createMapMock({ getBounds: getBoundsMock });

    waitForMapBounds(map);
    expect(map.getBounds).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(125);

    expect(map.getBounds).toHaveBeenCalledTimes(2);
  });

  // the below tests will work once this jest bug is fixed:
  // https://stackoverflow.com/questions/51126786/jest-fake-timers-with-promises

/*   it('polls and resolves when `getBounds` returns a good value', () => {
    const getBoundsMock = jest.fn().mockImplementation(() => successValue);
    
    map = createMapMock({ getBounds: getBoundsMock });
    jest.advanceTimersByTime(500);
    return waitForMapBounds(map).then((val) => {
      expect(val).toEqual(successValue);
    });
  });
  it('polls and rejects if no bounds are returned', async () => {
    const getBoundsMock = jest.fn().mockImplementation(() => {
      throw errorObj;
    });
    
    map = createMapMock({ getBounds: getBoundsMock });
    jest.advanceTimersByTime(2000);
    await expect(waitForMapBounds(map)).rejects.toEqual(errorObj);
  }); */
});

describe('calculatePopoverPlacement', () => {
  beforeEach(() => {
    map = createMapMock();
  });

  test('returns "left" if coordinates are more than 80% to the right of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 38.8 })).toBe('left');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -3, lng: 37.9 })).toBe('left');
  });

  test('returns "right" if coordinates are less than 20% to the left of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 37.3 })).toBe('right');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.8, lng: 37.1 })).toBe('right');
  });

  test('returns "top" if coordinates are more than 80% to the bottom of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.85, lng: 37.5 })).toBe('top');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.91, lng: 37.7 })).toBe('top');
  });

  test('returns "bottom" if coordinates are less than 20% to the top of the map', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.1, lng: 37.8 })).toBe('bottom');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.55, lng: 37.6 })).toBe('bottom');
  });

  test('returns "auto" by default', async () => {
    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2, lng: 39 },
      _sw: { lat: -3, lng: 37 },
    }));
    expect(await calculatePopoverPlacement(map, { lat: -2.5, lng: 38 })).toBe('auto');

    map.getBounds.mockImplementation(() => ({
      _ne: { lat: -2.5, lng: 38 },
      _sw: { lat: -3, lng: 37 },
    }));

    expect(await calculatePopoverPlacement(map, { lat: -2.7, lng: 37.5 })).toBe('auto');
  });
});
