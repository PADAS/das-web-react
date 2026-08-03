import React from 'react';
import userEvent from '@testing-library/user-event';

import { BOOTSTRAP_DEFAULTS } from '../../../constants';
import { CHOICE_LIST_ELEMENT_INPUT_TYPES } from '../../../utils/form-schemas/constants';
import { render, screen } from '../../../test-utils';

import ChoiceList from './';

describe('SchemaForm - formElements - ChoiceList', () => {

  const defaultProps = {
    details: {
      inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.DROPDOWN,
      options: [
        {
          description: 'ranger',
          display: 'DumboAlfonso',
          value: '048fdcef-f599-4205-8b44-1536d46645aa',
        },
        {
          description: 'system',
          display: 'EarthRanger System',
          value: '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
        },
        {
          description: 'manager',
          display: 'frank',
          value: '0d9fbeea-5252-4723-ba59-ca696baef2d9',
        },
      ],
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

  describe('Dropdown', () => {
    test('shows a non read only choice-list field as a Dropdown', () => {
      renderChoiceList();

      expect(screen.getByRole('combobox', { name: 'Choice list label' })).not.toHaveAttribute('aria-readonly');
    });

    test('shows a read only choice-list field as a Dropdown', () => {
      renderChoiceList({ ...defaultProps, readOnly: true });

      expect(screen.getByRole('combobox', { name: 'Choice list label' })).toHaveAttribute('aria-readonly', 'true');
    });

    test('shows a non required choice-list field as a Dropdown', () => {
      renderChoiceList({
        ...defaultProps
      });

      expect(screen.getByRole('combobox', { name: 'Choice list label' })).not.toBeRequired();
    });

    test('shows a required choice-list field as a Dropdown', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          isRequired: true
        }
      });

      expect(screen.getByRole('combobox', { name: 'Choice list label' })).toBeRequired();
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

      expect(screen.getByRole('combobox', { name: 'Choice list label' })).not.toHaveAccessibleDescription();
    });

    test('shows the description', () => {
      renderChoiceList();

      const description = screen.getByRole('paragraph');

      expect(description).not.toHaveClass('error');
      expect(description).toHaveTextContent('A really great description');
      expect(screen.getByRole('combobox', { name: 'Choice list label' })).toHaveAccessibleDescription('A really great description');
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
      expect(description).toHaveClass('error');
    });

    test('shows the displayable options in the dropdown menu', async () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          options: [
            { description: 'wallaby', display: 'Roo', value: 'v-roo-1' },
            { description: 'insect', display: 'Ant', value: 'v-ant' },
            { description: 'kangaroo', display: 'Roo', value: 'v-roo-2' },
            { description: 'reptile', display: 'Boa', value: 'v-boa' },
          ]
        }
      });

      await userEvent.type(screen.getByRole('combobox'), '{arrowdown}');

      const options = screen.getAllByRole('option');

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveAccessibleName('Ant');
      expect(options[1]).toHaveAccessibleName('Boa');
      expect(options[2]).toHaveAccessibleName('Roo wallaby');
      expect(options[3]).toHaveAccessibleName('Roo kangaroo');
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

      await userEvent.type(screen.getByRole('combobox'), '{arrowdown}');

      await userEvent.click(screen.getByText('EarthRanger System'));

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

      await userEvent.type(dropdown, '{arrowdown}');

      await userEvent.click(screen.getByText('EarthRanger System'));

      expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
        '0d553bb7-5c4f-43d7-9b82-a561a668ae64'
      ]);

      await userEvent.type(dropdown, '{arrowdown}');

      await userEvent.click(screen.getByText('frank'));

      expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
        '0d9fbeea-5252-4723-ba59-ca696baef2d9'
      ]);

      expect(onFieldChange).toHaveBeenCalledTimes(2);
    });

    test('renders the open menu in a portal on the document body above the modal layer so it is not clipped', async () => {
      renderChoiceList();

      await userEvent.type(screen.getByRole('combobox'), '{arrowdown}');

      let menuPortal = await screen.findByRole('listbox');
      while (menuPortal.parentElement && menuPortal.parentElement !== document.body) {
        menuPortal = menuPortal.parentElement;
      }

      expect(menuPortal.parentElement).toBe(document.body);
      expect(menuPortal).toHaveStyle({ zIndex: BOOTSTRAP_DEFAULTS.MODAL_ZINDEX + 1 });
    });
  });

  describe('List', () => {
    test('shows a non read only choice-list field as a List', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      expect(screen.getByRole('checkbox', { name: 'DumboAlfonso' })).not.toHaveAttribute('readonly');
      expect(screen.getByRole('checkbox', { name: 'EarthRanger System' })).not.toHaveAttribute('readonly');
      expect(screen.getByRole('checkbox', { name: 'frank' })).not.toHaveAttribute('readonly');
    });

    test('shows a read only choice-list field as a List', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        },
        readOnly: true
      });

      expect(screen.getByRole('checkbox', { name: 'DumboAlfonso' })).toHaveAttribute('readonly');
      expect(screen.getByRole('checkbox', { name: 'EarthRanger System' })).toHaveAttribute('readonly');
      expect(screen.getByRole('checkbox', { name: 'frank' })).toHaveAttribute('readonly');
    });

    test('shows a non required choice-list field as a List', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      expect(screen.getByRole('checkbox', { name: 'DumboAlfonso' })).not.toBeRequired();
    });

    test('shows a required choice-list field as a List', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          isRequired: true
        }
      });

      expect(screen.getByRole('checkbox', { name: 'DumboAlfonso' })).toBeRequired();
    });

    test('does not show an error state in the label if the value is valid', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      expect(screen.getByText('Choice list label')).not.toHaveClass('error');
    });

    test('shows an error state in the label if the value is invalid', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        },
        error: {
          message: 'A incredible error message'
        }
      });


      expect(screen.getByRole('group')).toHaveClass('error');
      expect(screen.getByText('A incredible error message')).toBeVisible();
    });

    test('does not show the description', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          description: null,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      expect(screen.getByRole('checkbox', { name: 'DumboAlfonso' })).not.toHaveAccessibleDescription();
    });

    test('shows the description', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      const description = screen.getByRole('paragraph');

      expect(description).not.toHaveClass('error');
      expect(description).toHaveTextContent('A really great description');
      expect(screen.getByRole('group', { name: 'Choice list label' })).toHaveAccessibleDescription('A really great description');
    });

    test('shows a valid input when there are no errors', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        }
      });

      const fieldset = screen.getByRole('group');

      expect(fieldset).toBeValid();
      expect(fieldset).not.toHaveAccessibleErrorMessage();
    });

    test('shows an invalid input when there are errors', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        },
        error: {
          message: 'A incredible error message'
        }
      });

      const fieldset = screen.getByRole('group');
      const description = screen.getByText('A incredible error message');

      expect(fieldset).toBeInvalid();
      expect(fieldset).toHaveAccessibleErrorMessage('A incredible error message');
      expect(description).toHaveClass('error');
    });

    test('shows the displayable options in the list', () => {
      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          options: [
            { description: 'wallaby', display: 'Roo', value: 'v-roo-1' },
            { description: 'insect', display: 'Ant', value: 'v-ant' },
            { description: 'kangaroo', display: 'Roo', value: 'v-roo-2' },
            { description: 'reptile', display: 'Boa', value: 'v-boa' },
          ]
        }
      });

      const checkboxes = screen.getAllByRole('checkbox');

      expect(checkboxes).toHaveLength(4);
      expect(checkboxes[0]).toHaveAccessibleName('Ant');
      expect(checkboxes[1]).toHaveAccessibleName('Boa');
      expect(checkboxes[2]).toHaveAccessibleName('Roo wallaby');
      expect(checkboxes[3]).toHaveAccessibleName('Roo kangaroo');
    });

    test('allow to select single option when the choice list is set to single selection', async () => {
      const onFieldChange = jest.fn();

      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST,
          multiple: false
        },
        onFieldChange
      });

      expect(onFieldChange).toHaveBeenCalledTimes(0);

      await userEvent.click(screen.getByText('EarthRanger System'));

      expect(onFieldChange).toHaveBeenCalledTimes(1);
      expect(onFieldChange).toHaveBeenCalledWith('a-choice', '0d553bb7-5c4f-43d7-9b82-a561a668ae64');
    });

    test('allow to select multiple options when the choice list is set to multiple selection', async () => {
      const onFieldChange = jest.fn();

      renderChoiceList({
        ...defaultProps,
        details: {
          ...defaultProps.details,
          inputType: CHOICE_LIST_ELEMENT_INPUT_TYPES.LIST
        },
        onFieldChange
      });

      expect(onFieldChange).toHaveBeenCalledTimes(0);

      await userEvent.click(screen.getByText('EarthRanger System'));

      expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
        '0d553bb7-5c4f-43d7-9b82-a561a668ae64'
      ]);

      await userEvent.click(screen.getByText('frank'));

      expect(onFieldChange).toHaveBeenCalledWith('a-choice', [
        '0d9fbeea-5252-4723-ba59-ca696baef2d9'
      ]);

      expect(onFieldChange).toHaveBeenCalledTimes(2);
    });

  });

});
