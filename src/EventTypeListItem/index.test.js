import axios from 'axios';
import { Provider } from 'react-redux';

import { act, render, screen, waitFor } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { svgCache } from '../SvgIcon';

import EventTypeListItem from './';

describe('EventTypeListItem', () => {
  let axiosSpy, store;

  beforeEach(() => {
    svgCache.clear();
    axiosSpy = jest.spyOn(axios, 'get');
    store = mockStore({ data: { community: null } });
  });

  const renderEventTypeListItem = (props) => render(<Provider store={store}>
    <EventTypeListItem default_priority={0} display="Fire" icon_id="fire_rep" value="fire" {...props} />
  </Provider>);

  const translateNameToFontElement = () => {
    const nameTextNode = [...screen.getByText('Fire').childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    const fontElement = document.createElement('font');
    fontElement.textContent = 'Fuego';
    nameTextNode.replaceWith(fontElement);
  };

  test('shows the icon and translated name when translation replaced the name before the icon loaded', async () => {
    let resolveFetch;
    axiosSpy.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { container } = renderEventTypeListItem();
    translateNameToFontElement();

    await act(async () => {
      resolveFetch({ data: '<svg><path d="M0 0"/></svg>', headers: { 'content-type': 'image/svg+xml' } });
    });

    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
    expect(screen.getByText('Fuego')).toBeInTheDocument();
  });
});
