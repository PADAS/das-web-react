import React from 'react';
import { render, screen } from '@testing-library/react';
import OptionsMenu, { Option } from './index';
import userEvent from '@testing-library/user-event';

describe('<OptionsMenu />',  () => {

  test('shows options when clicking kebab menu', async () => {
    const optionText = 'This is an option';
    render(
      <OptionsMenu>
        <Option>{optionText}</Option>
      </OptionsMenu>
    );

    expect( await screen.queryByText(optionText) ).not.toBeInTheDocument();
    const kebab = await screen.getByTestId('optionsMenu-kebab-button');
    userEvent.click(kebab);
    expect( await screen.findByText(optionText) ).toBeInTheDocument();
  });

  test('menu option is clickable', async () => {
    const optionText = 'This is an option';
    const handleOnClick = jest.fn();
    render(
      <OptionsMenu>
        <Option onClick={handleOnClick}>{optionText}</Option>
      </OptionsMenu>
    );

    const kebab = await screen.getByTestId('optionsMenu-kebab-button');
    userEvent.click(kebab);
    const option = await screen.findByText(optionText);
    userEvent.click(option);
    expect( handleOnClick ).toHaveBeenCalled();
  });

});