import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../../../../utils/v2-event-schemas/constants';
import { GPS_FORMATS } from '../../../../../../../utils/location';
import { mockStore } from '../../../../../../../__test-helpers/MockStore';

import Item from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - SortableList - Item', () => {
  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();
  const onChange = jest.fn();
  const onDelete = jest.fn();
  const renderField = jest.fn();
  const setIsFormModalOpen = jest.fn();
  const setIsFormPreviewOpen = jest.fn();

  let collectionDetails, store;
  beforeEach(() => {
    collectionDetails = {
      columns: 1,
      itemIdentifier: 'field-1',
      itemName: 'Collection 1',
      leftColumn: ['field-1', 'field-2'],
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

  const renderItem = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <Item
        blurLocationMarker={blurLocationMarker}
        breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
        collectionDetails={collectionDetails}
        errors={undefined}
        focusLocationMarker={focusLocationMarker}
        formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
        formElements={{
          'field-1': {
            details: {
              defaultInput: 'Default Value 1',
              label: 'Field 1',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
          'field-2': {
            details: {
              defaultInput: 'Default Value 2',
              label: 'Field 2',
            },
            type: FORM_ELEMENT_TYPES.TEXT,
          },
        }}
        id={1}
        index={0}
        isDragging={false}
        isDragOverlay={false}
        isFormModalOpen={false}
        isFormPreviewOpen={false}
        onChange={onChange}
        onDelete={onDelete}
        renderField={renderField}
        setIsFormModalOpen={setIsFormModalOpen}
        setIsFormPreviewOpen={setIsFormPreviewOpen}
        wasItemRecentlyAdded={false}
        {...props}
      />
    </Provider>
  );

  test('does not set the default form data for items that were not recently added', async () => {
    renderItem({ formData: {} });

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not set the default form data for new items that are drag overlays', async () => {
    renderItem({ formData: {}, wasItemRecentlyAdded: true, isDragOverlay: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not set the default form data for items that do not have default values', async () => {
    renderItem({
      formData: {},
      formElements: {
        'field-1': {
          details: {
            defaultInput: '',
            label: 'Field 1',
          },
          type: FORM_ELEMENT_TYPES.TEXT,
        },
        'field-2': {
          details: {
            defaultInput: '',
            label: 'Field 2',
          },
          type: FORM_ELEMENT_TYPES.TEXT,
        },
      },
      wasItemRecentlyAdded: true,
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the default form data for items that were recently added and are not drag overlays', async () => {
    renderItem({ formData: {}, wasItemRecentlyAdded: true });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ 'field-1': 'Default Value 1', 'field-2': 'Default Value 2' }, undefined);
  });

  test('shows the item with the form preview open', async () => {
    renderItem({ isFormPreviewOpen: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('open');
  });

  test('shows the item while it is being dragged', async () => {
    renderItem({ isDragging: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('isDragging');
    expect(document.body.style.cursor).toBe('grabbing');
  });

  test('shows the item as a drag overlay', async () => {
    renderItem({ isDragOverlay: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('dragOverlay');

    await userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByLabelText('Open the Value 1 form preview')[1]);

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();
  });

  test('shows an error state in the item if the children have errors', async () => {
    renderItem({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('error');
  });

  test('shows the item as read only if the collection is read only', async () => {
    renderItem({ readOnly: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('readOnly');
    expect(screen.getByRole('button', { name: 'Delete Value 1' })).toBeDisabled();
  });

  test('shows the item normally', async () => {
    renderItem();

    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('open');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('isDragging');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('dragOverlay');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('error');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('readOnly');
    expect(document.body.style.cursor).not.toBe('grabbing');
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByLabelText('Open the Value 1 form preview')[1]);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
  });

  test('assigns an id to the item based on its position in the form data', async () => {
    renderItem();

    expect(screen.getByTestId('schema-form-collection-item')).toHaveAttribute('id', 'collection-1.0');
  });

  test('does not assign an id to the item if the position index is not provided', async () => {
    renderItem({ index: undefined });

    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveAttribute('id');
  });

  test('opens the form preview when the user clicks the title', async () => {
    renderItem();

    const titleButton = screen.getAllByLabelText('Open the Value 1 form preview')[0];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    await userEvent.click(titleButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(true);
  });

  test('closes the form preview when user clicks the title again', async () => {
    renderItem({ isFormPreviewOpen: true });

    const titleButton = screen.getAllByLabelText('Close the Value 1 form preview')[0];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    await userEvent.click(titleButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(false);
  });

  test('sets a default title with the collection name and its index if there is no identifier', async () => {
    collectionDetails.itemIdentifier = undefined;
    renderItem();

    expect(screen.getByText('Collection 1 2')).toBeVisible();
  });

  test('sets a default title with the collection name and its index if the identifier field does not have a value', async () => {
    renderItem({ formData: { 'field-1': '', 'field-2': 'Value 2' } });

    expect(screen.getByText('Collection 1 2')).toBeVisible();
  });

  test('sets the identifier field value as the title', async () => {
    renderItem();

    const title = screen.getAllByText('Value 1')[0];

    expect(title).toBeVisible();
    expect(title).toHaveClass('title');
  });

  test('deletes the item when the user clicks the trash button', async () => {
    renderItem();

    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('opens the form modal when user clicks the edit button', async () => {
    renderItem();

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Edit Value 1'));


    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(true);
  });

  test('opens the form preview when user clicks the chevron', async () => {
    renderItem();

    const chevronButton = screen.getAllByLabelText('Open the Value 1 form preview')[1];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    await userEvent.click(chevronButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(true);
  });

  test('closes the form preview when user clicks the chevron again', async () => {
    renderItem({ isFormPreviewOpen: true });

    const chevronButton = screen.getAllByLabelText('Close the Value 1 form preview')[1];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    await userEvent.click(chevronButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(false);
  });

  test('closes the form modal when the user clicks Done', async () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderItem({ isFormModalOpen: true });

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Done'));

    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });

  test('changes the content of a child field and clears its error in the form modal', async () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderItem({ errors: { 'field-1': { message: 'Error' }, 'field-2': { message: 'Error' } }, isFormModalOpen: true });

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByTestId('field-1'), 'a');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      { 'field-1': 'Value 1a', 'field-2': 'Value 2' },
      { 'field-2': { message: 'Error' } }
    );
  });

  test('resets the initial values of the form and closes the form modal after editing it if the user clicks Cancel', async () => {
    const { rerender } = renderItem({ isFormModalOpen: true });

    rerender(
      <Provider store={mockStore(store)}>
        <Item
          blurLocationMarker={blurLocationMarker}
          breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
          collectionDetails={collectionDetails}
          errors={undefined}
          formData={{ 'field-1': 'New value 1', 'field-2': 'Value 2' }}
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
          id={1}
          isDragging={false}
          isDragOverlay={false}
          isFormModalOpen={true}
          isFormPreviewOpen={false}
          onChange={onChange}
          onDelete={onDelete}
          renderField={renderField}
          setIsFormModalOpen={setIsFormModalOpen}
          setIsFormPreviewOpen={setIsFormPreviewOpen}
        />
      </Provider>
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Cancel'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ 'field-1': 'Value 1', 'field-2': 'Value 2' }, undefined);
    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });

  test('deletes the item and closes the form modal when the user clicks the trash button in the modal', async () => {
    renderItem({ isFormModalOpen: true });

    const formModal = screen.getByRole('dialog');

    expect(onDelete).not.toHaveBeenCalled();
    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(within(formModal).getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });

  test('canceling the addition of a recent added item deletes the item and closes the modal', async () => {
    renderItem({ isFormModalOpen: true, wasItemRecentlyAdded: true });

    const formModal = screen.getByRole('dialog');

    expect(onDelete).not.toHaveBeenCalled();
    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    await userEvent.click(within(formModal).getByRole('button', { name: 'Cancel' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });
});
