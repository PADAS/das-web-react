import React, { useContext } from 'react';
import { render, screen } from '../../../test-utils';
import userEvent from '@testing-library/user-event';

import SchemaFormContextProvider, { SchemaFormContext } from './';

describe('ReportManager - SchemaForm - SchemaFormContext', () => {

  const schema = {
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
    schema,
    onFormChange: () => {},
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

  /*ToDo: add coverage for getFieldDetails as support for new field types is added */

});
