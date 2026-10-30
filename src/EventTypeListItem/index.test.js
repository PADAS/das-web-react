import axios from 'axios';
import { Provider } from 'react-redux';

import { act, render, waitFor } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { svgCache } from '../SvgIcon';

import EventTypeListItem from './';

describe('EventTypeListItem', () => {
  let axiosSpy, consoleErrorSpy, store;

  beforeEach(() => {
    svgCache.clear();
    axiosSpy = jest.spyOn(axios, 'get');
    consoleErrorSpy = jest.spyOn(console, 'error');
    store = mockStore({ data: { community: null } });
  });

  test('renders the icon and name when browser translation replaced the name before the icon loaded', async () => {
    let resolveFetch;
    axiosSpy.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { container, getByText } = render(<Provider store={store}>
      <EventTypeListItem default_priority={0} display="Fire" icon_id="fire_rep" value="fire" />
    </Provider>);

    // Chrome translation swaps the name's text node for <font> elements that React does not know about.
    const nameNode = [...getByText('Fire').childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    const font = document.createElement('font');
    font.textContent = 'Fuego';
    nameNode.replaceWith(font);

    await act(async () => {
      resolveFetch({ data: '<svg><path d="M0 0"/></svg>', headers: { 'content-type': 'image/svg+xml' } });
    });

    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
    expect(container).toHaveTextContent('Fuego');
    const notFoundErrorLogged = consoleErrorSpy.mock.calls
      .some((args) => args.some((arg) => String(arg?.name ?? arg).includes('NotFoundError')));
    expect(notFoundErrorLogged).toBe(false);
  });
});
