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

  test('menu closes when clicking outside', async () => {
    const menuTestId = 'option-menu-test-id';
    const toggleClass = 'show';
    const siblingElement = 'Another element';

    render(<div>
      <OptionsMenu data-testid={menuTestId}>
        <Option>a menu option</Option>
      </OptionsMenu>
      <p>{siblingElement}</p>
    </div>);

    const menu = await screen.getByTestId(menuTestId);
    expect(menu.classList.contains(toggleClass)).toBeFalsy();

    const kebab = await screen.getByTestId('optionsMenu-kebab-button');
    userEvent.click(kebab);
    expect(menu.classList.contains(toggleClass)).toBeTruthy();

    const paragraph = await screen.findByText(siblingElement);
    userEvent.click(paragraph);
    expect(menu.classList.contains(toggleClass)).toBeFalsy();
  });


});