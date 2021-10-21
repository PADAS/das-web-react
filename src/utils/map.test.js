import { createMapMock } from '../__test-helpers/mocks';

import { calculatePopoverPlacement, waitForMapBounds } from './map';

let map;
const errorObj = new Error('invalid LngLat');
// const successValue =  [[12, 21], [22, 32]];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();

  map = null;
});

describe('waitForMapBounds', () => {
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

  test('returns "left" if coordinates are more than 70% to the right of the map', async () => {
    map.getContainer.mockImplementation(() => ({ clientHeight: 1000, clientWidth: 1000 }));
    expect(calculatePopoverPlacement(map, { bottom: 0, right: 701 })).toBe('left');

    map.getContainer.mockImplementation(() => ({ clientHeight: 500, clientWidth: 500 }));

    expect(calculatePopoverPlacement(map, { bottom: 0, right: 351 })).toBe('left');
  });

  test('returns "right" if coordinates are more than 70% to the bottom of the map', async () => {
    map.getContainer.mockImplementation(() => ({ clientHeight: 1000, clientWidth: 1000 }));
    expect(calculatePopoverPlacement(map, { bottom: 701, right: 0 })).toBe('right');

    map.getContainer.mockImplementation(() => ({ clientHeight: 500, clientWidth: 500 }));

    expect(calculatePopoverPlacement(map, { bottom: 351, right: 0 })).toBe('right');
  });

  test('returns "auto" by default', async () => {
    map.getContainer.mockImplementation(() => ({ clientHeight: 1000, clientWidth: 1000 }));
    expect(calculatePopoverPlacement(map, { bottom: 0, right: 0 })).toBe('auto');
    expect(calculatePopoverPlacement(map, { bottom: 700, right: 700 })).toBe('auto');

    map.getContainer.mockImplementation(() => ({ clientHeight: 500, clientWidth: 500 }));

    expect(calculatePopoverPlacement(map, { bottom: 0, right: 0 })).toBe('auto');
    expect(calculatePopoverPlacement(map, { bottom: 350, right: 350 })).toBe('auto');
  });
});
