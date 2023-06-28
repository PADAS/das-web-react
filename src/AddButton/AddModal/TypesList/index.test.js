import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TypesList from './';

describe('AddButton - AddModal - TypesList', () => {
  const onClickType = jest.fn();
  let renderTypesList;
  beforeEach(() => {
    renderTypesList = (props) => {
      render(<TypesList
        filterText=""
        onClickType={onClickType}
        typesByCategory={[{
          display: 'Category 1',
          id: 'cat1',
          types: [{ display: 'Type 1', id: 'typ1' }, { display: 'Type 2', id: 'typ2' }],
          value: 'category 1',
        }, {
          display: 'Category 2',
          id: 'cat2',
          types: [{ display: 'Type 3', id: 'typ3' }],
          value: 'category 2',
        }]}
        {...props}
      />);
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('filters the types list by the filter text', async () => {
    renderTypesList({ filterText: '2' });

    const typeListItems = await screen.findAllByTestId((content) => content.startsWith('categoryList-button-'));

    expect(typeListItems).toHaveLength(2);
    expect(typeListItems[0]).toHaveTextContent('Type 2');
    expect(typeListItems[1]).toHaveTextContent('Type 3');
  });

  test('shows titles of categories when there are several', async () => {
    renderTypesList();

    expect((await screen.findByText('Category 1'))).toBeDefined();
    expect((await screen.findByText('Category 2'))).toBeDefined();
  });

  test('does not show titles of categories when there is only one', async () => {
    renderTypesList({
      typesByCategory: [{
        display: 'Category 1',
        id: 'cat1',
        types: [{ display: 'Type 1', id: 'typ1' }, { display: 'Type 2', id: 'typ2' }],
        value: 'category 1',
      }],
    });

    expect((await screen.queryByText('Category 1'))).toBeNull();
  });

  test('triggers onClickType when user clicks a type button', async () => {
    renderTypesList();

    expect(onClickType).toHaveBeenCalledTimes(0);

    const type2Button = await screen.findByTestId('categoryList-button-typ2');
    userEvent.click(type2Button);

    expect(onClickType).toHaveBeenCalledTimes(1);
    expect(onClickType).toHaveBeenCalledWith({ display: 'Type 2', id: 'typ2' });
  });
});
