import React from 'react';

import { render, screen } from '../../../../../test-utils';

import Collection from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Collection', () => {
  const renderField = jest.fn();

  let details;
  beforeEach(() => {
    details = {};
  });

  const renderCollectionField = (props) => render(<Collection
    details={details}
    id="collection-1"
    renderField={renderField}
    {...props}
  />);

  test('', () => {
    renderCollectionField();
  });
});
