import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';

import { act, render, screen, waitFor } from '../test-utils';
import { DAS_HOST } from '../constants';
import { mockStore } from '../__test-helpers/MockStore';
import { svgCache } from '../SvgIcon';

import EventTypeListItem from './';

const FIRE_ICON_URL = `${DAS_HOST}/static/sprite-src/fire_rep.svg`;

const server = setupServer();

describe('EventTypeListItem', () => {
  let iconResponse, store;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    svgCache.clear();
    iconResponse = Promise.withResolvers();
    server.use(http.get(FIRE_ICON_URL, () => iconResponse.promise));
    store = mockStore({ data: { community: null } });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
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
    const { container } = renderEventTypeListItem();
    translateNameToFontElement();

    await act(async () => {
      iconResponse.resolve(new HttpResponse('<svg><path d="M0 0"/></svg>', {
        headers: { 'Content-Type': 'image/svg+xml' },
      }));
    });

    await waitFor(() => {
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
    expect(screen.getByText('Fuego')).toBeInTheDocument();
  });
});
