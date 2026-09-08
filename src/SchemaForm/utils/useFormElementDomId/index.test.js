import React from 'react';

import { render, screen } from '../../../test-utils';

import useFormElementDomId, { FormInstanceContext } from './';

describe('SchemaForm - utils - useFormElementDomId', () => {
  const FormElement = () => <p data-testid="formElement">{useFormElementDomId('objective')}</p>;

  test('namespaces the form element id with the form instance id of the context', () => {
    render(<FormInstanceContext.Provider value="_r_1_">
      <FormElement />
    </FormInstanceContext.Provider>);

    expect(screen.getByTestId('formElement')).toHaveTextContent('_r_1_-objective');
  });

  test('returns the plain form element id when there is no form instance in the context', () => {
    render(<FormElement />);

    expect(screen.getByTestId('formElement')).toHaveTextContent('objective');
  });
});
