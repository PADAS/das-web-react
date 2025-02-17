import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../constants';
import { screen } from '../../../../../test-utils';

import ChoiceList from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - ChoiceList', () => {

  const defaultProps = {
    details: {
      inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
      options: [
        {
          'const': '048fdcef-f599-4205-8b44-1536d46645aa',
          'title': 'DumboAlfonso'
        },
        {
          'const': '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
          'title': 'EarthRanger System'
        },
        {
          'const': '0d9fbeea-5252-4723-ba59-ca696baef2d9',
          'title': 'frank'
        }],
      description: 'A really great description',
      hint: 'This is a placeholder',
      multiple: true,
      isRequired: false,
      label: 'Choice list label'
    },
    error: null,
    id: 'a-choice',
    onFieldChange: () => {},
    value: undefined
  };

  const renderChoiceList = (props = defaultProps) => render(
    <ChoiceList {...props} />
  );

  test('shows a non required choice list field', () => {
    renderChoiceList({
      ...defaultProps,
      error: 'An error'
    });


    expect(screen.getByText('Choice list label')).toBeVisible();
    expect(screen.getByRole('combobox')).not.toBeRequired();

  });

  test('shows a required choice list field', () => {
    renderChoiceList({
      ...defaultProps,
      details: {
        ...defaultProps.details,
        isRequired: true
      }
    });

    expect(screen.getByText('Choice list label *')).toBeVisible();
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderChoiceList();

    expect(screen.getByText('Choice list label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderChoiceList({
      ...defaultProps,
      error: {
        message: 'A incredible error message'
      }
    });


    expect(screen.getByText('Choice list label')).toHaveClass('error');
    expect(screen.getByText('A incredible error message')).toBeVisible();
  });

  test('does not show the description', () => {
    renderChoiceList({
      ...defaultProps,
      details: {
        ...defaultProps.details,
        description: null
      }
    });

    expect(screen.queryByText('A really great description')).toBeNull();
  });

  test('shows the description', () => {
    renderChoiceList();

    expect(screen.queryByText('A really great description')).toBeVisible();
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription();
  });

  test('shows a valid input when there are no errors', () => {
    renderChoiceList();

    const choiceListInput = screen.getByRole('combobox');

    expect(choiceListInput).toBeValid();
    expect(choiceListInput).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid input when there are errors', () => {
    renderChoiceList({
      ...defaultProps,
      error: {
        message: 'A incredible error message'
      }
    });

    const choiceListInput = screen.getByRole('combobox');
    const description = screen.getByText('A incredible error message');

    expect(choiceListInput).toBeInvalid();
    expect(choiceListInput).toHaveAccessibleErrorMessage('A incredible error message');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
    expect(description).toHaveClass('error');
  });

  test('allow to select single option when the choice list is set to single selection', async () => {
    const onFieldChange = jest.fn();

    renderChoiceList({
      ...defaultProps,
      details: {
        ...defaultProps.details,
        multiple: false
      },
      onFieldChange
    });

    expect(onFieldChange).toHaveBeenCalledTimes(0);

    userEvent.type(screen.getByRole('combobox'), '{arrowdown}');

    userEvent.click(screen.getByText('EarthRanger System'));

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('a-choice', '0d553bb7-5c4f-43d7-9b82-a561a668ae64');
  });

  test('allow to select multiple options when the choice list is set to multiple selection', async () => {
    const onFieldChange = jest.fn();
    renderChoiceList({
      ...defaultProps,
      onFieldChange
    });

    expect(onFieldChange).toHaveBeenCalledTimes(0);

    const dropdown = screen.getByRole('combobox');

    userEvent.type(dropdown, '{arrowdown}');

    userEvent.click(screen.getByText('EarthRanger System'));

    expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
      '0d553bb7-5c4f-43d7-9b82-a561a668ae64'
    ]);

    userEvent.type(dropdown, '{arrowdown}');

    userEvent.click(screen.getByText('frank'));

    expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
      '0d9fbeea-5252-4723-ba59-ca696baef2d9'
    ]);

    expect(onFieldChange).toHaveBeenCalledTimes(2);
  });

});
