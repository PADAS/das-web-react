import React from 'react';

import { render, screen } from '../../../../../test-utils';

import Section from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Section', () => {
  const renderField = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      columns: 2,
      label: 'Section 1 Label',
      leftColumn: ['text-1'],
      rightColumn: [],
    };
  });

  const renderSectionField = (props) => render(<Section
    details={details}
    id="section-1"
    renderField={renderField}
    {...props}
  />);

  test('does not show a header if the label is not defined', () => {
    details.label = '';
    renderSectionField();

    expect(screen.queryByRole('heading')).toBeNull();
  });

  test('shows the header if the labes is defined', () => {
    renderSectionField();

    expect(screen.getByRole('heading')).toHaveTextContent('Section 1 Label');
  });

  test('shows the left column when it is the only column', () => {
    details.columns = 1;
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('fullWidth');
  });

  test('shows the left column when there are two columns', () => {
    renderSectionField();

    const leftColumn = screen.getByTestId('schema-form-section-section-1-left-column');

    expect(leftColumn).toBeVisible();
    expect(leftColumn).toHaveClass('halfWidthLeft');
  });

  test('does not show the right column if the section has one column', () => {
    details.columns = 1;
    renderSectionField();

    expect(screen.queryByTestId('schema-form-section-section-1-right-column')).toBeNull();
  });

  test('shows the right column if the section has two columns', () => {
    renderSectionField();

    expect(screen.getByTestId('schema-form-section-section-1-right-column')).toBeVisible();
  });

  test('renders the children', () => {
    renderSectionField();

    expect(renderField).toHaveBeenCalledTimes(1);
    expect(renderField).toHaveBeenCalledWith('text-1');
  });
});
