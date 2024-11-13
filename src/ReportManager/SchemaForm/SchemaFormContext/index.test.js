import React, { useContext } from 'react';
import { render, screen } from '../../../test-utils';

import SchemaFormContextProvider, { SchemaFormContext } from './index';
import userEvent from '@testing-library/user-event';
import { FORM_FIELDS_TYPES } from '../constants';

describe('ReportManager - SchemaForm - SchemaFormContext', () => {

  const efb = {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'this_is_a_text': {
          'default': 'initial value',
          'deprecated': false,
          'description': 'some good description',
          'title': 'This is a text',
          'type': 'string'
        }
      },
      'required': [
        'this_is_a_text'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'this_is_a_text': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'a placeholder',
          'type': 'TEXT',
          'parent': 'section-_PdgePvPWyACfu9sgN_F6'
        }
      },
      'headers': {
        'header-ghqdjqGinaJMptIEJBQmO': {
          'label': 'A great header',
          'section': 'section-_PdgePvPWyACfu9sgN_F6',
          'size': 'LARGE'
        }
      },
      'order': [
        'section-_PdgePvPWyACfu9sgN_F6'
      ],
      'sections': {
        'section-_PdgePvPWyACfu9sgN_F6': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-ghqdjqGinaJMptIEJBQmO',
              'type': 'header'
            },
            {
              'name': 'this_is_a_text',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  };

  const initialContextProps = {
    schema: efb,
    onFieldChange: () => {},
    formData: {
      'this_is_a_text': 'a text value'
    },
    formErrors: {}
  };

  const renderSchemaFormContext = (contextProps = initialContextProps, TestComponent, testComponentProps) => render(
    <SchemaFormContextProvider {...contextProps}>
      <TestComponent {...testComponentProps} />
    </SchemaFormContextProvider>
  );

  test('gets section details', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { getSectionDetails } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( getSectionDetails('section-_PdgePvPWyACfu9sgN_F6') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith({
      'columns': 1,
      'isActive': true,
      'label': '',
      'leftColumn': [
        {
          'name': 'header-ghqdjqGinaJMptIEJBQmO',
          'type': 'header'
        },
        {
          'name': 'this_is_a_text',
          'type': 'field'
        }
      ],
      'rightColumn': []
    });
  });

  test('gets header details', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { getHeaderDetails } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( getHeaderDetails('header-ghqdjqGinaJMptIEJBQmO') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith({
      'label': 'A great header',
      'section': 'section-_PdgePvPWyACfu9sgN_F6',
      'size': 'LARGE'
    });
  });

  test('gets text field details', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { getFieldDetails } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( getFieldDetails('this_is_a_text') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith({
      defaultInput: 'initial value',
      description: 'some good description',
      inputType: 'SHORT_TEXT',
      isActive: true,
      isRequired: true,
      label: 'This is a text',
      placeholder: 'a placeholder',
      value: 'a text value',
      error: null
    });
  });

  test('gets field UI type of text field', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { getFieldUIType } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( getFieldUIType('this_is_a_text') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith(FORM_FIELDS_TYPES.TEXT);
  });

  test('checks if an item is a section', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { isSection } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( isSection('section-_PdgePvPWyACfu9sgN_F6') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith(true);
  });

  test('checks if an item is a field', async () => {
    const onClick = jest.fn();
    const Component = ({ onClick }) => {
      const { isField } = useContext(SchemaFormContext);

      return (
        <button onClick={() => onClick( isField('this_is_a_text') )}>
          button
        </button>
      );
    };

    renderSchemaFormContext(undefined, Component, { onClick });

    await userEvent.click(screen.getByRole('button'));

    expect( onClick ).toHaveBeenCalledWith(true);
  });

});
