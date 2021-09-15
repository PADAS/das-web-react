import { createMapMock } from '../__test-helpers/mocks';

import { waitForMapBounds } from './map';

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