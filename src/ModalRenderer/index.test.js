import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import ImageModal from '../ImageModal';
import { MapContext } from '../MapContext';
import ModalRenderer from './';
import { mockStore } from '../__test-helpers/MockStore';
import { removeModal } from '../ducks/modals';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  removeModal: jest.fn(),
}));

jest.mock('../ImageModal', () => {
  const MockImageModal = () => <div title="image-modal-content" />;
  return { __esModule: true, default: MockImageModal };
});

describe('ModalRenderer', () => {
  let map, removeModalMock, store;

  const renderModalRenderer = () => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <ModalRenderer />
      </MapContext.Provider>
    </Provider>
  );

  beforeEach(() => {
    map = createMapMock();
    removeModalMock = jest.fn(() => () => {});
    removeModal.mockImplementation(removeModalMock);
    store = {
      view: {
        mapLocationSelection: {},
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
  });

  test('renders the modal container if there is at least one modal', async () => {
    renderModalRenderer();

    expect(screen.findByTestId('modalsRenderer-container')).toBeTruthy();
  });

  test('does not render the modal container if there are no modals', async () => {
    store.view.modals.modals = [];

    renderModalRenderer();

    expect(screen.queryByTestId('modalsRenderer-container')).toBeNull();
  });

  test('renders the content of the modal in the array', async () => {
    renderModalRenderer();

    expect(screen.findByTitle('content-component')).toBeTruthy();
  });

  test('removes the modal when pressing escape', async () => {
    renderModalRenderer();

    expect(removeModal).toHaveBeenCalledTimes(0);

    await userEvent.keyboard('{Escape}');

    expect(removeModal).toHaveBeenCalledTimes(1);
  });

  test('does not remove the modal when pressing escape if user is picking location', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;

    renderModalRenderer();

    await userEvent.keyboard('{Escape}');

    expect(removeModal).toHaveBeenCalledTimes(0);
  });

  test('applies the image-modal background style when the content is ImageModal', async () => {
    store.view.modals.modals = [{ content: ImageModal, id: '1' }];

    renderModalRenderer();

    expect(screen.getByRole('dialog').className).toMatch('modalImageBackground');
  });

  test('does not apply the image-modal background style when the content is not ImageModal', async () => {
    const AnotherModal = () => <div title="another-modal-content" />;

    store.view.modals.modals = [{ content: AnotherModal, id: '1' }];

    renderModalRenderer();

    expect(screen.getByRole('dialog').className).not.toMatch('modalImageBackground');
  });

  test('hides the backdrop and dialog without unmounting them when canShowModals is false', async () => {
    store.view.modals.canShowModals = false;

    renderModalRenderer();

    expect(screen.getByRole('dialog', { hidden: true })).toHaveStyle({ opacity: '0' });
    expect(document.querySelector('.modal-dialog').className).toMatch('hide');
    expect(document.querySelector('.modal-backdrop').className).toMatch('hide');
  });

  test('forwards the map from context and any extra item fields to the content component', async () => {
    const contentSpy = jest.fn(() => <div title="spy-content" />);
    store.view.modals.modals = [{
      content: contentSpy,
      id: 'abc',
      title: 'Some Title',
      url: 'some/url',
    }];

    renderModalRenderer();

    const [props] = contentSpy.mock.calls[0];

    expect(props.id).toBe('abc');
    expect(props.title).toBe('Some Title');
    expect(props.url).toBe('some/url');
    expect(props.map).toBe(map);
  });

  test('renders multiple modals at once', async () => {
    store.view.modals.modals = [
      { content: () => <div title="first-modal" />, id: '1' },
      { content: () => <div title="second-modal" />, id: '2' },
    ];

    renderModalRenderer();

    expect(screen.getByTitle('first-modal')).toBeTruthy();
    expect(screen.getByTitle('second-modal')).toBeTruthy();
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
  });

  test('applies modalProps overrides to the underlying dialog', async () => {
    store.view.modals.modals = [{
      content: () => <div title="content-component" />,
      id: '1',
      modalProps: { className: 'daily-report-modal' },
    }];

    renderModalRenderer();

    expect(screen.getByRole('dialog').className).toMatch('daily-report-modal');
  });
});
