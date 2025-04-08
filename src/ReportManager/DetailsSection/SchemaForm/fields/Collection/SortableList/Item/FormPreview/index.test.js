import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../../../../../../../../test-utils';
import { FORM_ELEMENT_TYPES } from '../../../../../constants';
import { GPS_FORMATS } from '../../../../../../../../utils/location';
import { mockStore } from '../../../../../../../../__test-helpers/MockStore';
import useJumpToLocation from '../../../../../../../../hooks/useJumpToLocation';

import FormPreview from './';

jest.mock('../../../../../../../../hooks/useJumpToLocation', () => jest.fn());

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection - SortableList - Item - FormPreview', () => {
  const blurLocationMarker = jest.fn();
  const focusLocationMarker = jest.fn();

  let jumpToLocationMock, store;
  beforeEach(() => {
    jumpToLocationMock = jest.fn();
    useJumpToLocation.mockImplementation(() => jumpToLocationMock);

    store = {
      view: {
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const renderFormPreview = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <FormPreview
        blurLocationMarker={blurLocationMarker}
        errors={undefined}
        fieldIds={['field-1', 'field-2']}
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
        isDragOverlay={false}
        {...props}
      />
    </Provider>
  );

  test('shows the form preview as a drag overlay', () => {
    renderFormPreview({ isDragOverlay: true });

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).toHaveClass('dragOverlay');
  });

  test('does not show the form preview as a drag overlay', () => {
    renderFormPreview();

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).not.toHaveClass('dragOverlay');
  });

  test('shows an error state if there are errors', () => {
    renderFormPreview({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).toHaveClass('error');
  });

  test('does not show an error state if there are no errors', () => {
    renderFormPreview();

    expect(screen.getByTestId('schema-form-collection-item-form-preview')).not.toHaveClass('error');
  });

  test('shows the preview of each field with its value', () => {
    renderFormPreview();

    expect(screen.getByText('Field 1')).toBeVisible();
    expect(screen.getByText('Value 1')).toBeVisible();
    expect(screen.getByText('Field 2')).toBeVisible();
    expect(screen.getByText('Value 2')).toBeVisible();
  });

  test('shows an error state in the preview of erroneous fields', () => {
    renderFormPreview({ errors: { 'field-1': { message: 'Error' } } });

    expect(screen.getByText('Field 1')).toHaveClass('error');
    expect(screen.getByText('Value 1')).toHaveClass('error');
    expect(screen.getByText('Field 2')).not.toHaveClass('error');
    expect(screen.getByText('Value 2')).not.toHaveClass('error');
  });

  test('shows a jump to location button for location fields with values', () => {
    renderFormPreview({
      fieldIds: ['field-1', 'field-2'],
      fields: {
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
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
      formData: { 'field-1': 'Value 1', 'field-2': { latitude: 10, longitude: 10 } },
    });

    expect(screen.getByLabelText('Jump to Field 2 location')).toBeVisible();
  });

  test('does not show a jump to location button if fields are not of type location', () => {
    renderFormPreview();

    expect(screen.queryByLabelText('Jump to Field 2 location')).toBeNull();
  });

  test('does not show a jump to location button for location fields without values', () => {
    renderFormPreview({
      fieldIds: ['field-1', 'field-2'],
      fields: {
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
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
      formData: { 'field-1': 'Value 1' },
    });

    expect(screen.queryByLabelText('Jump to Field 2 location')).toBeNull();
  });

  test('jumps to the location of a location field when clicking the button and focuses its marker', () => {
    renderFormPreview({
      fieldIds: ['field-1', 'field-2'],
      fields: {
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
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
      formData: { 'field-1': 'Value 1', 'field-2': { latitude: 10, longitude: 10 } },
    });

    expect(jumpToLocationMock).not.toHaveBeenCalled();
    expect(focusLocationMarker).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Jump to Field 2 location'));

    expect(jumpToLocationMock).toHaveBeenCalledTimes(1);
    expect(jumpToLocationMock).toHaveBeenCalledWith([10, 10], 20);
    expect(focusLocationMarker).toHaveBeenCalledTimes(1);
    expect(focusLocationMarker).toHaveBeenCalledWith('field-2');
  });

  test('does neither jump to the location of a location field when clicking the button nor focuses its marker if its a drag overlay', () => {
    renderFormPreview({
      fieldIds: ['field-1', 'field-2'],
      fields: {
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
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
      formData: { 'field-1': 'Value 1', 'field-2': { latitude: 10, longitude: 10 } },
      isDragOverlay: true,
    });

    userEvent.click(screen.getByLabelText('Jump to Field 2 location'));

    expect(jumpToLocationMock).not.toHaveBeenCalled();
    expect(focusLocationMarker).not.toHaveBeenCalled();
  });

  test('blurs the location marker when the jump to location button is blurred', () => {
    renderFormPreview({
      fieldIds: ['field-1', 'field-2'],
      fields: {
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
          type: FORM_ELEMENT_TYPES.LOCATION,
        },
      },
      formData: { 'field-1': 'Value 1', 'field-2': { latitude: 10, longitude: 10 } },
    });

    userEvent.click(screen.getByLabelText('Jump to Field 2 location'));

    expect(blurLocationMarker).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Jump to Field 2 location'));

    expect(blurLocationMarker).toHaveBeenCalledTimes(1);
  });
});
