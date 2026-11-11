import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';

import CollectionViewModal from './';

const SCHEMA = {
  json: {
    properties: {
      sightings: {
        items: {
          properties: {
            herd_seen: { title: 'Herd seen', type: 'boolean' },
            note: { title: 'Note', type: 'string' },
          },
          required: [],
          type: 'object',
        },
        title: 'Sightings',
        type: 'array',
      },
      title_field: { title: 'Title', type: 'string' },
    },
    required: ['title_field'],
  },
  ui: {
    fields: {
      sightings: {
        buttonText: '',
        columns: 1,
        conditionalDependents: [],
        itemIdentifier: 'note',
        itemName: 'Sighting',
        leftColumn: ['sightings.herd_seen', 'sightings.note'],
        parent: 'section-1',
        rightColumn: [],
        type: 'COLLECTION',
      },
      'sightings.herd_seen': { conditionalDependents: [], parent: 'sightings', type: 'BOOLEAN' },
      'sightings.note': {
        conditionalDependents: [],
        inputType: 'SHORT_TEXT',
        parent: 'sightings',
        placeholder: '',
        type: 'TEXT',
      },
      title_field: {
        conditionalDependents: [],
        inputType: 'SHORT_TEXT',
        parent: 'section-1',
        placeholder: '',
        type: 'TEXT',
      },
    },
    headers: {},
    order: ['section-1'],
    sections: {
      'section-1': {
        columns: 1,
        conditions: [],
        isActive: true,
        label: 'Details',
        leftColumn: [{ name: 'title_field', type: 'field' }, { name: 'sightings', type: 'field' }],
        rightColumn: [],
      },
    },
  },
};

describe('FeedTable - EventsTable - CollectionViewModal', () => {
  const renderCollectionViewModal = () => render(
    <Provider store={mockStore({ data: {}, view: { coordinateReferenceSystems: { storedSystems: [] }, modals: { canShowModals: true }, userPreferences: {} } })}>
      <CollectionViewModal
        fieldName="sightings"
        schema={SCHEMA}
        title="Sightings"
        value={[{ herd_seen: false, note: 'By the river' }]}
      />
    </Provider>
  );

  test('shows only the collection, not the rest of the form', () => {
    renderCollectionViewModal();

    expect(screen.queryByText('Details')).toBeNull();
    expect(screen.queryByText('Title')).toBeNull();
  });

  test('shows the fields of an item with their labels and humanized values', async () => {
    renderCollectionViewModal();

    await userEvent.click(screen.getAllByRole('button', { name: /By the river/ })[0]);

    expect(await screen.findByText('Herd seen')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('offers no way to add items', () => {
    renderCollectionViewModal();

    expect(screen.getByRole('button', { name: /Add/ })).toBeDisabled();
  });
});
