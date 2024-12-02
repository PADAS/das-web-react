import React, { useContext, useEffect } from 'react';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID, TEXT_ELEMENT_INPUT_TYPES } from '../constants';
import { render, screen } from '../../../../test-utils';

import SchemaFormContextProvider, { SchemaFormContext } from './';

describe('ReportManager - DetailsSection -SchemaForm - SchemaFormContext', () => {
  const onFormChange = jest.fn();

  const renderSchemaFormContext = ({ children, ...props }) => render(<SchemaFormContextProvider
      fields={{
        'text-1': {
          details: {
            defaultInput: 'Text 1 Default Input',
            description: 'Text 1 Description',
            inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
            isRequired: true,
            label: 'Text 1 Label',
            placeholder: 'Text 1 Placeholder',
            value: 'text-1',
          },
          parentId: 'section-1',
          type: FORM_ELEMENT_TYPES.TEXT,
        },
        [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
        'section-1': {
          details: {
            columns: 2,
            label: 'Section 1 Label',
            leftColumn: ['text-1'],
            rightColumn: [],
          },
          parentId: ROOT_CANVAS_ID,
          type: FORM_ELEMENT_TYPES.SECTION,
        },
      }}
      formData={{ 'text-1': 'Text 1' }}
      onFormChange={onFormChange}
      {...props}
    >
    {children}
  </SchemaFormContextProvider>);

  test('provides the fields object', async () => {
    const Component = () => {
      const { fields } = useContext(SchemaFormContext);

      return <div data-testid="fields">{JSON.stringify(fields)}</div>;
    };

    renderSchemaFormContext({ children: <Component /> });

    expect(screen.getByTestId('fields')).toHaveTextContent(
      '{"text-1":{"details":{"defaultInput":"Text 1 Default Input","description":"Text 1 Description","inputType":"SHORT_TEXT","isRequired":true,"label":"Text 1 Label","placeholder":"Text 1 Placeholder","value":"text-1"},"parentId":"section-1","type":"TEXT"},"root":{"details":{"fields":["section-1"]}},"section-1":{"details":{"columns":2,"label":"Section 1 Label","leftColumn":["text-1"],"rightColumn":[]},"parentId":"root","type":"SECTION"}}'
    );
  });

  test('provides the form data object', async () => {
    const Component = () => {
      const { formData } = useContext(SchemaFormContext);

      return <div data-testid="formData">{JSON.stringify(formData)}</div>;
    };

    renderSchemaFormContext({ children: <Component /> });

    expect(screen.getByTestId('formData')).toHaveTextContent('{"text-1":"Text 1"}');
  });

  test('triggers a form change when there is a field update', async () => {
    const Component = () => {
      const { onFieldChange } = useContext(SchemaFormContext);

      useEffect(() => {
        onFieldChange('text-1', 'New Text 1');
      }, [onFieldChange]);

      return null;
    };

    renderSchemaFormContext({ children: <Component /> });

    expect(onFormChange).toHaveBeenCalledTimes(1);
    expect(onFormChange).toHaveBeenCalledWith({ formData: { 'text-1': 'New Text 1' } });
  });
});
