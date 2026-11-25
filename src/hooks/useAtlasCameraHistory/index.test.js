import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate, useNavigationType } from 'react-router';

import { MapContext } from '../../MapContext';

import useAtlasCameraHistory, {
  ATLAS_HISTORY_COALESCE_MS,
  jumpToStartingCamera,
  MOVE_END_TIMEOUT_MS,
  RECORD_LINK_ZOOM,
  useJumpToCameraOnHistoryPop,
} from './';

// A map whose moves end on the next tick, as mapbox reports moveend after easing.
const createMap = ({ center = [10, 20], zoom = 5 } = {}) => {
  const listeners = {};
  const camera = { center, zoom };
  const emit = (type) => (listeners[type] ?? []).slice().forEach((listener) => listener({ type }));
  const moveTo = ({ center: nextCenter, zoom: nextZoom }) => {
    camera.center = nextCenter;
    camera.zoom = nextZoom;
    setTimeout(() => emit('moveend'), 0);
  };

  return {
    easeTo: jest.fn(moveTo),
    emit,
    getCenter: () => ({ lat: camera.center[1], lng: camera.center[0] }),
    getZoom: () => camera.zoom,
    jumpTo: jest.fn(moveTo),
    off: jest.fn((type, listener) => {
      listeners[type] = (listeners[type] ?? []).filter((item) => item !== listener);
    }),
    on: jest.fn((type, listener) => {
      listeners[type] = [...(listeners[type] ?? []), listener];
    }),
  };
};

const renderCameraHistory = ({ initialEntry = '/atlas?keep=1', initialState, map = createMap() } = {}) => {
  const rendered = renderHook(() => {
    useJumpToCameraOnHistoryPop(map);

    return {
      cameraHistory: useAtlasCameraHistory(),
      location: useLocation(),
      navigate: useNavigate(),
      navigationType: useNavigationType(),
    };
  }, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[{ pathname: initialEntry.split('?')[0], search: `?${initialEntry.split('?')[1] ?? ''}`, state: initialState }]}>
      <MapContext.Provider value={map}>{children}</MapContext.Provider>
    </MemoryRouter>,
  });

  const current = () => rendered.result.current;
  const url = () => `${current().location.pathname}${current().location.search}`;

  // An Atlas move: begin, then the move ending, with the effects of each write flushed.
  const atlasMove = async (target, { navigateTo, replace } = {}) => {
    let session;
    act(() => {
      session = current().cameraHistory.begin();
    });
    if (navigateTo) act(() => current().navigate(navigateTo));
    await act(async () => {
      await current().cameraHistory.move(session, () => map.easeTo(target), { replace });
    });

    return session;
  };

  const goBack = () => act(() => current().navigate(-1));

  return { atlasMove, current, goBack, map, url };
};

describe('hooks - useAtlasCameraHistory', () => {
  let now;
  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes the camera before a move into the current entry, and pushes the camera after it', async () => {
    const { atlasMove, current, goBack, map, url } = renderCameraHistory();

    await atlasMove({ center: [36.8, -1.3], zoom: 12 });

    expect(url()).toBe('/atlas?keep=1&lnglat=36.800000,-1.300000&zoom=12.00');
    expect(current().navigationType).toBe('PUSH');

    goBack();

    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
    expect(current().navigationType).toBe('POP');
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [10, 20], zoom: 5 });
  });

  test('keeps the location state of the entries it writes', async () => {
    const { atlasMove, current, goBack } = renderCameraHistory({ initialState: { temporalId: 'abc' } });

    await atlasMove({ center: [1, 1], zoom: 3 });

    expect(current().location.state).toEqual({ temporalId: 'abc' });

    goBack();

    expect(current().location.state).toEqual({ temporalId: 'abc' });
  });

  test('replaces the entry of a move made soon after the previous one, so a reply is one Back step', async () => {
    const { atlasMove, current, goBack, url } = renderCameraHistory();

    await atlasMove({ center: [1, 1], zoom: 3 });
    now += ATLAS_HISTORY_COALESCE_MS - 1;
    await atlasMove({ center: [2, 2], zoom: 4 });

    expect(url()).toBe('/atlas?keep=1&lnglat=2.000000,2.000000&zoom=4.00');
    expect(current().navigationType).toBe('REPLACE');

    goBack();

    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
  });

  test('pushes a new entry for a move made later', async () => {
    const { atlasMove, goBack, url } = renderCameraHistory();

    await atlasMove({ center: [1, 1], zoom: 3 });
    now += ATLAS_HISTORY_COALESCE_MS;
    await atlasMove({ center: [2, 2], zoom: 4 });

    goBack();

    expect(url()).toBe('/atlas?keep=1&lnglat=1.000000,1.000000&zoom=3.00');
  });

  test('joins the camera to the entry an Atlas navigation pushed', async () => {
    const { atlasMove, current, goBack, url } = renderCameraHistory();

    await atlasMove({ center: [36.8, -1.3], zoom: 15 }, { navigateTo: '/events/abc' });

    expect(url()).toBe('/events/abc?lnglat=36.800000,-1.300000&zoom=15.00');
    expect(current().navigationType).toBe('REPLACE');

    goBack();

    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
  });

  test('replaces the entry when asked, as when a subject is framed again', async () => {
    const { atlasMove, current, goBack, map, url } = renderCameraHistory();

    const session = await atlasMove({ center: [1, 1], zoom: 3 });
    now += ATLAS_HISTORY_COALESCE_MS * 10;
    await act(async () => {
      await current().cameraHistory.move(session, () => map.easeTo({ center: [1.5, 1.5], zoom: 3.5 }), { replace: true });
    });

    expect(current().navigationType).toBe('REPLACE');
    expect(url()).toBe('/atlas?keep=1&lnglat=1.500000,1.500000&zoom=3.50');

    goBack();

    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
  });

  test('writes the camera after a move that never reports its end', async () => {
    jest.useFakeTimers();
    try {
      const map = createMap();
      map.easeTo.mockImplementation(() => {});
      const { current, url } = renderCameraHistory({ map });

      let session;
      act(() => {
        session = current().cameraHistory.begin();
      });
      let moved;
      act(() => {
        moved = current().cameraHistory.move(session, () => map.easeTo({}));
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(MOVE_END_TIMEOUT_MS);
        await moved;
      });

      expect(current().navigationType).toBe('PUSH');
      expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
    } finally {
      jest.useRealTimers();
    }
  });

  test('writes nothing when the user moves the map', async () => {
    const { current, map, url } = renderCameraHistory();

    await act(async () => {
      map.easeTo({ center: [3, 3], zoom: 9 });
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    expect(url()).toBe('/atlas?keep=1');
    expect(current().navigationType).toBe('POP');
  });

  test('writes nothing when Back jumps the map', async () => {
    const { atlasMove, current, goBack, map, url } = renderCameraHistory();

    await atlasMove({ center: [1, 1], zoom: 3 });
    goBack();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });

    expect(map.jumpTo).toHaveBeenCalledTimes(1);
    expect(current().navigationType).toBe('POP');
    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');
  });

  test('does not jump on Back to an entry without a zoom', async () => {
    const { current, goBack, map } = renderCameraHistory({ initialEntry: '/atlas?lnglat=1,2' });

    act(() => current().navigate('/events'));
    goBack();

    expect(map.jumpTo).not.toHaveBeenCalled();
  });

  test('writes nothing after a move whose signal aborts before it ends, and leaves the next move its own entry', async () => {
    const { atlasMove, current, map, url } = renderCameraHistory();
    const controller = new AbortController();

    let session;
    act(() => {
      session = current().cameraHistory.begin();
    });
    await act(async () => {
      const moved = current().cameraHistory.move(
        session,
        () => map.easeTo({ center: [1, 1], zoom: 3 }),
        { signal: controller.signal }
      );
      controller.abort();
      await moved;
    });

    expect(map.easeTo).toHaveBeenCalled();
    expect(current().navigationType).toBe('REPLACE');
    expect(url()).toBe('/atlas?keep=1&lnglat=10.000000,20.000000&zoom=5.00');

    await atlasMove({ center: [2, 2], zoom: 4 });

    expect(current().navigationType).toBe('PUSH');
  });

  test('moves without writing when there is no session', async () => {
    const { current, map, url } = renderCameraHistory();

    await act(async () => {
      await current().cameraHistory.move(null, () => map.easeTo({ center: [1, 1], zoom: 2 }));
    });

    expect(map.easeTo).toHaveBeenCalled();
    expect(url()).toBe('/atlas?keep=1');
  });
});

describe('hooks - useAtlasCameraHistory - jumpToStartingCamera', () => {
  const setUp = (search) => {
    const map = { jumpTo: jest.fn() };
    const navigate = jest.fn();
    const location = { hash: '', pathname: '/events/abc', search, state: null };

    return { handled: jumpToStartingCamera({ location, map, navigate }), map, navigate };
  };

  test('jumps exactly to a camera with a zoom and leaves the URL alone', () => {
    const { handled, map, navigate } = setUp('?lnglat=36.8,-1.3&zoom=12.5');

    expect(handled).toBe(true);
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [36.8, -1.3], zoom: 12.5 });
    expect(navigate).not.toHaveBeenCalled();
  });

  test('jumps to a record link centre at the record zoom and drops it from the URL, as before', () => {
    const { handled, map, navigate } = setUp('?other=1&lnglat=36.8,-1.3');

    expect(handled).toBe(true);
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [36.8, -1.3], zoom: RECORD_LINK_ZOOM });
    expect(navigate).toHaveBeenCalledWith(
      { hash: '', pathname: '/events/abc', search: '?other=1', state: null },
      { replace: true, state: { comesFromLngLatRedirection: true } }
    );
  });

  test('drops a malformed centre without jumping', () => {
    const { handled, map, navigate } = setUp('?lnglat=nowhere');

    expect(handled).toBe(true);
    expect(map.jumpTo).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
  });

  test('leaves a URL without a camera to the home map', () => {
    const { handled, map, navigate } = setUp('?other=1');

    expect(handled).toBe(false);
    expect(map.jumpTo).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
