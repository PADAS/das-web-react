import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import ModalRenderer from './';
import { mockStore } from '../__test-helpers/MockStore';
import { removeModal } from '../ducks/modals';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  removeModal: jest.fn(),
}));

describe('ModalRenderer', () => {
  let map, removeModalMock, store;
  beforeEach(() => {
    map = createMapMock();
    removeModalMock = jest.fn(() => () => {});
    removeModal.mockImplementation(removeModalMock);
    store = {
      view: {
        modals: {
          modals: [{
            content: () => <div title="content-component" />,
            id: '1',
            title: 'Subject Information',
            url: 'trackingmetadata/export',
          }],
          canShowModals: true,
        },
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <ModalRenderer map={map} />
      </Provider>
    );
  });

  test('renders the modal container if there is at least one modal', async () => {
    expect(screen.findByTestId('modalsRenderer-container')).toBeTruthy();
  });

  test('does not render the modal container if there are no modals', async () => {
    store.view.modals.modals = [];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <ModalRenderer map={map} />
      </Provider>
    );

    expect(screen.queryByTestId('modalsRenderer-container')).toBeNull();
  });

  test('renders the content of the modal in the array', async () => {
    expect(screen.findByTitle('content-component')).toBeTruthy();
  });
});
