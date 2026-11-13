import { Provider } from 'react-redux';

import { act, render } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { STATUSES } from '../constants';
import { updateNetworkStatus } from '../ducks/system-status';

import DetectOffline from './';

describe('DetectOffline', () => {
  let isOnline;
  let store;

  beforeEach(() => {
    isOnline = true;
    jest.spyOn(window.navigator, 'onLine', 'get').mockImplementation(() => isOnline);

    store = mockStore({ data: {}, view: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderDetectOffline = () => render(<Provider store={store}>
    <DetectOffline />
  </Provider>);

  const changeNetwork = (isNowOnline) => act(() => {
    isOnline = isNowOnline;
    window.dispatchEvent(new Event(isNowOnline ? 'online' : 'offline'));
  });

  test('marks the network unhealthy when the browser goes offline', () => {
    renderDetectOffline();

    changeNetwork(false);

    expect(store.getActions()).toEqual([updateNetworkStatus(STATUSES.UNHEALTHY_STATUS)]);
  });

  test('marks the network healthy again when the browser comes back online', () => {
    renderDetectOffline();

    changeNetwork(false);
    changeNetwork(true);

    expect(store.getActions()).toEqual([
      updateNetworkStatus(STATUSES.UNHEALTHY_STATUS),
      updateNetworkStatus(STATUSES.HEALTHY_STATUS),
    ]);
  });

  test('stops listening to the network once unmounted', () => {
    const { unmount } = renderDetectOffline();

    unmount();
    changeNetwork(false);

    expect(store.getActions()).toEqual([]);
  });
});
