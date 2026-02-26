import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../../utils/v2-event-schemas/constants';
import { GPS_FORMATS } from '../../../../../utils/location';
import { mockStore } from '../../../../../__test-helpers/MockStore';

import Collection from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection', () => {
  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const onFieldChange = jest.fn();
  const renderField = jest.fn();

  let details, store;
  beforeEach(() => {
    details = {
      buttonText: 'Add button text',
      columns: 1,
      description: 'The collection description',
      isActive: true,
      itemIdentifier: 'field-1',
      itemName: 'Item',
      label: 'Collection 1 Label',
      leftColumn: ['field-1', 'field-2'],
      maxItems: null,
      minItems: null,
      rightColumn: [],
      value: 'collection-1',
    };

    store = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        modals: {
          canShowModals: true,
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const renderCollectionField = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <Collection
        blurLocationMarker={blurLocationMarker}
        breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
        details={details}
        error={undefined}
        focusLocationMarker={focusLocationMarker}
        formElements={{
          'field-1': {
            details: {
              label: 'Field 1',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
          'field-2': {
            details: {
              label: 'Field 2',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
        }}
        id="collection-1"
        onFieldChange={onFieldChange}
        renderField={renderField}
        value={undefined}
        {...props}
      />
    </Provider>
  );

  test('shows a non read only collection field', () => {
    renderCollectionField();

    expect(screen.getByRole('button', { name: 'Add Item' })).not.toBeDisabled();
  });

  test('shows a read only collection field', () => {
    renderCollectionField({ readOnly: true });

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
  });

  test('shows a valid collection when there are no errors', async () => {
    renderCollectionField();

    const collection = screen.getByTestId('schema-form-collection-collection-1');

    expect(collection).toBeValid();
    expect(collection).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid collection when there are errors', async () => {
    renderCollectionField({ error: { message: 'Error' } });

    const collection = screen.getByTestId('schema-form-collection-collection-1');
    const description = screen.getByText('Error');

    expect(collection).toBeInvalid();
    expect(collection).toHaveAccessibleErrorMessage('Error');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
  });

  test('does not show the description', () => {
    details.description = '';
    renderCollectionField();

    expect(screen.queryByText('The collection description')).toBeNull();
  });

  test('shows the description', () => {
    renderCollectionField();

    const description = screen.getByText('The collection description');

    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
  });

  test('shows a non required collection', () => {
    renderCollectionField();

    expect(screen.getByText('Collection 1 Label (0)')).toBeVisible();
  });

  test('shows a required collection', () => {
    details.isRequired = true;
    renderCollectionField();

    expect(screen.getByText('Collection 1 Label (0) *')).toBeVisible();
  });

  test('does not show an error state in the header if the collection and its items are all valid', async () => {
    renderCollectionField();

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).not.toHaveClass('error');
  });

  test('shows an error state in the header if the collection is invalid', async () => {
    renderCollectionField({ error: { message: 'Error' } });

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).toHaveClass('error');
  });

  test('shows an error state in the header if any collection item is invalid', async () => {
    renderCollectionField({ error: { 0: { 'field-1': 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).toHaveClass('error');
  });

  test('sets the collection label with the number of items it contains', async () => {
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getByLabelText('Collection 1 Label (2)')).toBeVisible();
  });

  test('closes the collection list when the user clicks the chevron', async () => {
    renderCollectionField();

    const chevronButton = screen.getByLabelText('Close the Collection 1 Label list');

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens the collection list when the user clicks the chevron again', async () => {
    renderCollectionField();

    const chevronButton = screen.getByLabelText('Close the Collection 1 Label list');

    await userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows an empty state if the collection does not have items', async () => {
    renderCollectionField();

    expect(screen.queryByTestId('schema-form-collection-item')).toBeNull();
    expect(screen.getByTestId('schema-form-collection-list-empty-state')).toBeVisible();
  });

  test('shows the list of items', async () => {
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getAllByTestId('schema-form-collection-item')).toHaveLength(2);
    expect(screen.queryByTestId('schema-form-collection-list-empty-state')).toBeNull();
  });

  test('focuses a location marker prefixed with the collection value and the item index', async () => {
    renderField.mockImplementation((_id, _value, _onChange, _error, focusLocationMarker) => {
      focusLocationMarker('location-1');

      return null;
    });
    renderCollectionField({ value: [{}] });

    await userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(focusLocationMarker).toHaveBeenCalled();
    expect(focusLocationMarker).toHaveBeenCalledWith('collection-1.0.location-1');
  });

  test('opens and closes the form preview of an item', async () => {
    renderCollectionField({ value: [{}] });

    const collectionItem = screen.getByTestId('schema-form-collection-item');
    const itemChevronButton = screen.getAllByLabelText('Open the Item 1 form preview')[1];

    expect(collectionItem).not.toHaveClass('open');

    await userEvent.click(itemChevronButton);

    expect(collectionItem).toHaveClass('open');

    await userEvent.click(itemChevronButton);

    expect(collectionItem).not.toHaveClass('open');
  });

  test('opens and closes the form modal of an item', async () => {
    renderCollectionField({ value: [{}] });

    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(screen.getByRole('dialog')).toBeVisible();

    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('changes the collection value when there is a change in an item and updates the error from the item', async () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderCollectionField({
      error: { 0: { 'field-1': { message: 'Error' }, 'field-2': { message: 'Error' } } },
      value: [{}, {}],
    });

    await userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(onFieldChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByTestId('field-1'), 'a');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith(
      'collection-1',
      [{ 'field-1': 'a' }, {}],
      { 0: { 'field-2': { message: 'Error' } } }
    );
  });

  test('changes the collection value when an item is deleted from the item header and removes the collection error message and the errors from the deleted item', async () => {
    renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    expect(onFieldChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Delete Item 1'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('collection-1', [{}], undefined);
  });

  test('changes the collection value when an item is deleted from the modal and removes the collection error message and the errors from the deleted item', async () => {
    renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    await userEvent.click(screen.getByLabelText('Edit Item 1'));
    const formModal = screen.getByRole('dialog');

    expect(onFieldChange).not.toHaveBeenCalled();

    await userEvent.click(within(formModal).getByLabelText('Delete Item 1'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('collection-1', [{}], undefined);
  });

  test('shows the button text from the schema', async () => {
    renderCollectionField();

    expect(screen.getByText('Add button text')).toBeVisible();
  });

  test('shows a default button text if the schema does not define one', async () => {
    details.buttonText = '';
    renderCollectionField();

    expect(screen.getByText('Add')).toBeVisible();
  });

  test('disables the add button if there is a max items constraint and it was reached', async () => {
    details.maxItems = 3;
    renderCollectionField({ value: [{}, {}, {}] });

    expect(screen.getByText('Add button text')).toBeDisabled();
  });

  test('does not disable the add button if there is a max items constraint and it has not been reached', async () => {
    details.maxItems = 3;
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getByText('Add button text')).toBeEnabled();
  });

  test('opens the form modal and changes the collection value when an item is added and removes its error message', async () => {
    const { rerender } = renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    expect(onFieldChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(screen.getByText('Add button text'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith(
      'collection-1',
      [{}, {}, {}],
      { 0: { 'field-1': { message: 'Error' } } }
    );

    rerender(
      <Provider store={mockStore(store)}>
        <Collection
          blurLocationMarker={blurLocationMarker}
          breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
          details={details}
          error={{ 0: { 'field-1': { message: 'Error' } } }}
          formElements={{
            'field-1': {
              details: {
                label: 'Field 1',
              },
              type: FORM_ELEMENT_TYPES.TEXT,
            },
            'field-2': {
              details: {
                label: 'Field 2',
              },
              type: FORM_ELEMENT_TYPES.TEXT,
            },
          }}
          id="collection-1"
          onFieldChange={onFieldChange}
          renderField={renderField}
          value={[{}, {}, {}]}
        />
      </Provider>
    );

    expect(screen.getByRole('dialog')).toBeVisible();
  });
});
