import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';

import DateTime from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - DateTime', () => {
  const onFieldChange = jest.fn();

  let details;
  beforeEach(() => {
    details = {};
  });

  const renderDateTimeField = (props) => render(<DateTime {...props} />);

  test('', () => {
    renderDateTimeField();
  });
});
