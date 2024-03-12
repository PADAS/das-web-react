import React from 'react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { activePatrol } from '../../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';
import { report } from '../../../__test-helpers/fixtures/reports';
import { TRACKS_API_URL } from '../../../ducks/tracks';
import { LINK_TYPES } from '../../../constants';

import LinkItem from '.';

const store = {
  data: { eventFilter: { filter: { date_range: {} } }, eventTypes: [], patrolTypes: [], tracks: {} },
  view: { timeSliderState: {}, trackLength: { origin: 'eventFilter' }, featureFlagOverrides: {} },
};

jest.mock('../../../store', () => mockStore(store));

const server = setupServer(
  rest.get(
    TRACKS_API_URL(activePatrol.patrol_segments[0].leader.id),
    (req, res, ctx) => res(ctx.json({ data: { features: {} } }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportManager - LinksSection - LinkItem', () => {
  test('renders a patrol list item if type is patrol', async () => {
    render(<Provider store={mockStore(store)}>
      <LinkItem item={activePatrol} type={LINK_TYPES.PATROL} />
    </Provider>);

    expect((await screen.findByTestId('patrol-list-item-title-05113dd3-3f41-49ef-aa7d-fbc6b7379533')))
      .toHaveTextContent('The Don Patrol Aza');
  });

  test('renders a report list item if type is report', async () => {
    render(<Provider store={mockStore(store)}>
      <LinkItem item={report} type={LINK_TYPES.EVENT} />
    </Provider>);

    expect((await screen.findByTestId('feed-list-item-title-container'))).toHaveTextContent('165634light_rep');
  });
});
