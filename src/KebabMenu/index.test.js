import React from 'react';
import { render, screen } from '@testing-library/react';
import KebabMenu from './index';
import userEvent from '@testing-library/user-event';

describe('<KebabMenu />',  () => {

  test('shows options when clicking kebab menu', async () => {
    const optionText = 'This is an option';
    render(
      <KebabMenu>
        <KebabMenu.Option>{optionText}</KebabMenu.Option>
      </KebabMenu>
    );

    expect( await screen.queryByText(optionText) ).not.toBeInTheDocument();
    const kebab = await screen.getByRole('button');
    userEvent.click(kebab);
    expect( await screen.findByText(optionText) ).toBeInTheDocument();
  });

  test('menu option is clickable', async () => {
    const optionText = 'This is an option';
    const handleOnClick = jest.fn();
    render(
      <KebabMenu>
        <KebabMenu.Option onClick={handleOnClick}>{optionText}</KebabMenu.Option>
      </KebabMenu>
    );

    const kebab = await screen.getByRole('button');
    userEvent.click(kebab);
    const option = await screen.findByText(optionText);
    userEvent.click(option);
    expect( handleOnClick ).toHaveBeenCalled();
  });

});