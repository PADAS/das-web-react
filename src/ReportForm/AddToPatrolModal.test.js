import React from 'react';
import { Provider } from 'react-redux';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { INITIAL_PATROLS_STATE, PATROLS_API_URL } from '../ducks/patrols';

import { mockStore } from '../__test-helpers/MockStore';
import mockPatrolData from '../__test-helpers/fixtures/patrols';

import { within } from '@testing-library/dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddtoPatrolModal from './AddToPatrolModal';

import SocketProvider from '../__test-helpers/MockSocketContext';

const server = setupServer(
  rest.get(PATROLS_API_URL, (req, res, ctx) => {
    console.log('YO I AM SO CALLED');

    return res(ctx.json( { data: {
      results: mockPatrolData,
    } }));
  }),
  rest.post(PATROLS_API_URL, (req, res, ctx) => {
    return res(ctx.status(201));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


let store = mockStore({ view: { }, data: { patrolStore: { }, patrols: { ...INITIAL_PATROLS_STATE } } });

test('rendering without crashing', () => {
  render(<Provider store={store}>
    <SocketProvider>
      <AddtoPatrolModal />
    </SocketProvider>
  </Provider>);
});

describe('the "add to patrol" modal within a report form', () => {
  test('fetching patrols and updating the patrol store on render', async () => {
    render(<Provider store={store}>
      <SocketProvider>
        <AddtoPatrolModal />
      </SocketProvider>
    </Provider>);

    await screen.findByTestId('patrol-feed-container');
  });
});