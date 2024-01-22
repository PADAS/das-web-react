import React from 'react';
import { Provider } from 'react-redux';
import merge from 'lodash/merge';

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { I18nextProvider } from 'react-i18next';

import * as patrolDuckExports from '../ducks/patrols';
import * as modalDuckExports from '../ducks/modals';

import { mockStore } from '../__test-helpers/MockStore';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import mockPatrolData from '../__test-helpers/fixtures/patrols';
import mockPatrolTypeData from '../__test-helpers/fixtures/patrol-types';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddtoPatrolModal from './';

import SocketProvider from '../__test-helpers/MockSocketContext';
import i18nForTests from '../i18nForTests';

const { INITIAL_PATROLS_STATE, PATROLS_API_URL } = patrolDuckExports;

const mockPatrolApiResponse = {
  results: mockPatrolData,
};

const server = setupServer(
  rest.get(PATROLS_API_URL, (req, res, ctx) => {
    return res(ctx.json( { data: mockPatrolApiResponse }));
  }),
  rest.post(PATROLS_API_URL, (req, res, ctx) => {
    return res(ctx.status(201));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const defaultStoreValue = { view: { patrolTrackState: { pinned: [], visible: [] }, trackState: { pinned: [], visible: [] } }, data: { eventTypes, patrolTypes: mockPatrolTypeData, patrolStore: { }, subjectStore: {}, patrols: { ...INITIAL_PATROLS_STATE }, tracks: {} } };

const onAddToPatrol = jest.fn();


const store = mockStore({ ...defaultStoreValue });

const renderAddToPatrolModal = (storeOverride  = store, testModalId) => render(
  <Provider store={storeOverride}>
    <SocketProvider>
      <I18nextProvider i18n={i18nForTests}>
        <AddtoPatrolModal onAddToPatrol={onAddToPatrol} id={testModalId} />
      </I18nextProvider>
    </SocketProvider>
  </Provider>
);

test('rendering without crashing', () => {
  renderAddToPatrolModal();
});

describe('the "add to patrol" modal within a report form', () => {
  test('fetching patrols and updating the patrol store on render', async () => {
    const storeUpdateSpy = jest.spyOn(patrolDuckExports, 'updatePatrolStore');

    renderAddToPatrolModal();

    await waitFor(() => {
      expect(storeUpdateSpy).toHaveBeenCalledWith(mockPatrolApiResponse);
    });

  });

  test('listing the patrols if any are present', async () => {
    const store = mockStore(
      merge({}, defaultStoreValue, {
        data: {
          patrolStore: mockPatrolData
            .reduce((accumulator, patrol) =>
              ({ ...accumulator, [patrol.id]: patrol })
            , {}),
          patrols: INITIAL_PATROLS_STATE,
        }
      }
      ));

    renderAddToPatrolModal(store);

    await screen.findByTestId('patrol-feed-container');
  });

  test('showing a loading overlay initially', async () => {
    renderAddToPatrolModal();

    await screen.findByTestId('patrol-feed-loading-overlay');
  });

  test('listing the patrols if any are present', async () => {
    const store = mockStore(
      merge({}, defaultStoreValue, {
        data: {
          patrolStore: mockPatrolData
            .reduce((accumulator, patrol) =>
              ({ ...accumulator, [patrol.id]: patrol })
            , {}),
          patrols: INITIAL_PATROLS_STATE,
        }
      }
      ));

    renderAddToPatrolModal(store);

    await screen.findByTestId('patrol-feed-container');

    const listItems = await screen.findAllByTestId('add-patrol-list-item', { exact: false }); /* items have testids of add-patrol-list-item-${index}, this lets us count them all as a collection */
    expect(listItems).toHaveLength(mockPatrolData.length);
  });

  test('showing an empty message if no items are present', async () => {
    server.use(
      rest.get(PATROLS_API_URL, (req, res, ctx) => {
        return res.once(ctx.json( { data: {
          results: [],
        } }));
      })
    );

    renderAddToPatrolModal();

    const container = await screen.findByTestId('patrol-feed-container');

    expect(container).toHaveTextContent('No more patrols to display.');
  });

  test('clicking a patrol list item\'s button elements to invoke the "onAddToPatrol" callback', async () => {
    const store = mockStore(
      merge({}, defaultStoreValue, {
        data: {
          patrolStore: mockPatrolData
            .reduce((accumulator, patrol) =>
              ({ ...accumulator, [patrol.id]: patrol })
            , {}),
          patrols: INITIAL_PATROLS_STATE,
        }
      }
      ));

    renderAddToPatrolModal(store);

    expect(onAddToPatrol).not.toHaveBeenCalled();

    const firstListItem = await screen.findByTestId('add-patrol-list-item-0');
    const button = firstListItem.querySelector('button');
    userEvent.click(button);

    expect(onAddToPatrol).toHaveBeenCalled();
  });

  test('clicking the "cancel" button hides the modal', async () => {
    const TEST_MODAL_ID = 'TEST_MODAL_ID';

    const removeModalSpy = jest.spyOn(modalDuckExports, 'removeModal');

    renderAddToPatrolModal(undefined, TEST_MODAL_ID);

    const cancelBtn = await screen.findByTestId('close-modal-button');
    userEvent.click(cancelBtn);

    expect(removeModalSpy).toHaveBeenCalledWith(TEST_MODAL_ID);

  });
});