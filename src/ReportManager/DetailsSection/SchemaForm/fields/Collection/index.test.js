import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../constants';
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
        fields={{
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
        focusLocationMarker={focusLocationMarker}
        id="collection-1"
        onFieldChange={onFieldChange}
        renderField={renderField}
        value={undefined}
        {...props}
      />
    </Provider>
  );

  test('shows a valid collection when there are no errors', () => {
    renderCollectionField();

    const collection = screen.getByTestId('schema-form-collection-collection-1');

    expect(collection).toBeValid();
    expect(collection).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid collection when there are errors', () => {
    renderCollectionField({ error: { message: 'Error' } });

    const collection = screen.getByTestId('schema-form-collection-collection-1');
    const description = screen.getByText('Error');

    expect(collection).toBeInvalid();
    expect(collection).toHaveAccessibleErrorMessage('Error');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
  });

  test('does not show an error state in the header if the collection and its items are all valid', () => {
    renderCollectionField();

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).not.toHaveClass('error');
  });

  test('shows an error state in the header if the collection is invalid', () => {
    renderCollectionField({ error: { message: 'Error' } });

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).toHaveClass('error');
  });

  test('shows an error state in the header if any collection item is invalid', () => {
    renderCollectionField({ error: { 0: { 'field-1': 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-header-collection-1')).toHaveClass('error');
  });

  test('sets the collection label with the number of items it continas', () => {
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getByLabelText('Collection 1 Label (2)')).toBeVisible();
  });

  test('closes the collection list when the user clicks the chevron', () => {
    renderCollectionField();

    const chevronButton = screen.getByLabelText('Close the Collection 1 Label list');

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens the collection list when the user clicks the chevron again', () => {
    renderCollectionField();

    const chevronButton = screen.getByLabelText('Close the Collection 1 Label list');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(chevronButton);

    expect(chevronButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows an empty state if the collection does not have items', () => {
    renderCollectionField();

    expect(screen.queryByTestId('schema-form-collection-item')).toBeNull();
    expect(screen.getByTestId('schema-form-collection-list-empty-state')).toBeVisible();
  });

  test('shows the list of items', () => {
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getAllByTestId('schema-form-collection-item')).toHaveLength(2);
    expect(screen.queryByTestId('schema-form-collection-list-empty-state')).toBeNull();
  });

  test('focuses a location marker prefixed with the collection value and the item index', () => {
    renderField.mockImplementation((_id, _value, _onChange, _error, focusLocationMarker) => {
      focusLocationMarker('location-1');

      return null;
    });
    renderCollectionField({ value: [{}] });

    userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(focusLocationMarker).toHaveBeenCalled();
    expect(focusLocationMarker).toHaveBeenCalledWith('collection-1.0.location-1');
  });

  test('opens and closes the form preview of an item', () => {
    renderCollectionField({ value: [{}] });

    const collectionItem = screen.getByTestId('schema-form-collection-item');
    const itemChevronButton = screen.getAllByLabelText('Open the Item 1 form preview')[1];

    expect(collectionItem).not.toHaveClass('open');

    userEvent.click(itemChevronButton);

    expect(collectionItem).toHaveClass('open');

    userEvent.click(itemChevronButton);

    expect(collectionItem).not.toHaveClass('open');
  });

  test('opens and closes the form modal of an item', async () => {
    renderCollectionField({ value: [{}] });

    expect(screen.queryByRole('dialog')).toBeNull();

    userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(screen.getByRole('dialog')).toBeVisible();

    userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('changes the collection value when there is a change in an item and updates the error from the item', () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderCollectionField({
      error: { 0: { 'field-1': { message: 'Error' }, 'field-2': { message: 'Error' } } },
      value: [{}, {}],
    });

    userEvent.click(screen.getByLabelText('Edit Item 1'));

    expect(onFieldChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByTestId('field-1'), 'a');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith(
      'collection-1',
      [{ 'field-1': 'a' }, {}],
      { 0: { 'field-2': { message: 'Error' } } }
    );
  });

  test('changes the collection value when an item is deleted from the item header and removes the collection error message and the errors from the deleted item', () => {
    renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    expect(onFieldChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Delete Item 1'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('collection-1', [{}], undefined);
  });

  test('changes the collection value when an item is deleted from the modal and removes the collection error message and the errors from the deleted item', () => {
    renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    userEvent.click(screen.getByLabelText('Edit Item 1'));
    const formModal = screen.getByRole('dialog');

    expect(onFieldChange).not.toHaveBeenCalled();

    userEvent.click(within(formModal).getByLabelText('Delete Item 1'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('collection-1', [{}], undefined);
  });

  test('shows the button text from the schema', () => {
    renderCollectionField();

    expect(screen.getByText('Add button text')).toBeVisible();
  });

  test('shows a default button text if the schema does not define one', () => {
    details.buttonText = '';
    renderCollectionField();

    expect(screen.getByText('Add')).toBeVisible();
  });

  test('disables the add button if there is a max items constraint and it was reached', () => {
    details.maxItems = 3;
    renderCollectionField({ value: [{}, {}, {}] });

    expect(screen.getByText('Add button text')).toBeDisabled();
  });

  test('does not disable the add button if there is a max items constraint and it has not been reached', () => {
    details.maxItems = 3;
    renderCollectionField({ value: [{}, {}] });

    expect(screen.getByText('Add button text')).toBeEnabled();
  });

  test('opens the form modal and changes the collection value when an item is added and removes its error message', () => {
    const { rerender } = renderCollectionField({ error: { 0: { 'field-1': { message: 'Error' } }, message: 'Error' }, value: [{}, {}] });

    expect(onFieldChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    userEvent.click(screen.getByText('Add button text'));

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
          fields={{
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
