import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../constants';
import { GPS_FORMATS } from '../../../../../../../utils/location';
import { mockStore } from '../../../../../../../__test-helpers/MockStore';

import Item from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - SortableList - Item', () => {
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
        breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
        collectionDetails={collectionDetails}
        errors={undefined}
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
        formData={{ 'field-1': 'Value 1', 'field-2': 'Value 2' }}
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
        {...props}
      />
    </Provider>
  );

  test('shows the item with the form preview open', () => {
    renderItem({ isFormPreviewOpen: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('open');
  });

  test('shows the item while it is being dragged', () => {
    renderItem({ isDragging: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('isDragging');
    expect(document.body.style.cursor).toBe('grabbing');
  });

  test('shows the item as a drag overlay', () => {
    renderItem({ isDragOverlay: true });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('dragOverlay');

    userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByLabelText('Open the Value 1 form preview')[1]);

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();
  });

  test('shows an error state in the item if the children have errors', () => {
    renderItem({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-item')).toHaveClass('error');
  });

  test('shows the item normally', () => {
    renderItem();

    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('open');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('isDragging');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('dragOverlay');
    expect(screen.getByTestId('schema-form-collection-item')).not.toHaveClass('error');
    expect(document.body.style.cursor).not.toBe('grabbing');
    expect(onDelete).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Edit Value 1'));

    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByLabelText('Open the Value 1 form preview')[1]);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
  });

  test('assigns an id to the item based on its position in the form data', () => {
    renderItem();

    expect(screen.getByTestId('schema-form-collection-item')).toHaveAttribute('id', 'collection-1.0');
  });

  test('opens the form preview when the user clicks the title', () => {
    renderItem();

    const titleButton = screen.getAllByLabelText('Open the Value 1 form preview')[0];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    userEvent.click(titleButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(true);
  });

  test('closes the form preview when user clicks the title again', () => {
    renderItem({ isFormPreviewOpen: true });

    const titleButton = screen.getAllByLabelText('Close the Value 1 form preview')[0];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    userEvent.click(titleButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(false);
  });

  test('sets a default title with the collection name and its index if there is no identifier', () => {
    collectionDetails.itemIdentifier = undefined;
    renderItem();

    expect(screen.getByText('Collection 1 2')).toBeVisible();
  });

  test('sets a default title with the collection name and its index if the identifier field does not have a value', () => {
    renderItem({ formData: { 'field-1': '', 'field-2': 'Value 2' } });

    expect(screen.getByText('Collection 1 2')).toBeVisible();
  });

  test('sets the identifier field value as the title', () => {
    renderItem();

    const title = screen.getAllByText('Value 1')[0];

    expect(title).toBeVisible();
    expect(title).toHaveClass('title');
  });

  test('deletes the item when the user clicks the trash button', async () => {
    renderItem();

    expect(onDelete).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('opens the form modal when user clicks the edit button', () => {
    renderItem();

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Edit Value 1'));


    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(true);
  });

  test('opens the form preview when user clicks the chevron', () => {
    renderItem();

    const chevronButton = screen.getAllByLabelText('Open the Value 1 form preview')[1];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    userEvent.click(chevronButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(true);
  });

  test('closes the form preview when user clicks the chevron again', () => {
    renderItem({ isFormPreviewOpen: true });

    const chevronButton = screen.getAllByLabelText('Close the Value 1 form preview')[1];

    expect(setIsFormPreviewOpen).not.toHaveBeenCalled();

    userEvent.click(chevronButton);

    expect(setIsFormPreviewOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormPreviewOpen).toHaveBeenCalledWith(false);
  });

  test('closes the form modal when the user clicks Done', () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderItem({ isFormModalOpen: true });

    expect(setIsFormModalOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Done'));

    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });

  test('changes the content of a child field and clears its error in the form modal', () => {
    renderField.mockImplementation((id, value, onChange) => <input
      data-testid={id}
      onChange={(event) => onChange(id, event.target.value)}
      value={value}
    />);
    renderItem({ errors: { 'field-1': { message: 'Error' }, 'field-2': { message: 'Error' } }, isFormModalOpen: true });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByTestId('field-1'), 'a');

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
          breadcrumbs={[{ id: '1', display: 'Item 1' }, { id: '2', display: 'Item 2' }]}
          collectionDetails={collectionDetails}
          errors={undefined}
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
          formData={{ 'field-1': 'New value 1', 'field-2': 'Value 2' }}
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

    userEvent.click(screen.getByText('Cancel'));

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

    userEvent.click(within(formModal).getByLabelText('Delete Value 1'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledTimes(1);
    expect(setIsFormModalOpen).toHaveBeenCalledWith(false);
  });
});
