import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useListSortWithButton } from './';

describe('#useListSortWithButton', () => {
  let timeSortButton, listItems;

  beforeEach(async () => {
    const list = [
      {
        sortDate: new Date('10-20-2021'),
        node: <li>I am older!</li>,
      },
      {
        sortDate: new Date('10-20-2022'),
        node: <li>I am newer!</li>,
      },
    ];

    const TestComponent = ({ list }) => {
      const [SortButton, SortedResults] = useListSortWithButton(list);

      return <>
        <SortButton />
        <ul>
          <SortedResults />
        </ul>
      </>;
    };

    render(<TestComponent list={list} />);

    timeSortButton = await screen.findByRole('button');

    listItems = await screen.findAllByRole('listitem');
  });
  test('rendering a sort button and a node list, sorted by default in descending order', async () => {
    expect(timeSortButton).toBeInTheDocument();

    expect(listItems[0]).toHaveTextContent('I am newer!');
    expect(listItems[1]).toHaveTextContent('I am older!');

  });

  test('changing the sort to ascending order', async () => {
    expect(listItems[0]).toHaveTextContent('I am newer!');
    expect(listItems[1]).toHaveTextContent('I am older!');

    userEvent.click(timeSortButton);

    listItems = await screen.findAllByRole('listitem');

    expect(listItems[0]).toHaveTextContent('I am older!');
    expect(listItems[1]).toHaveTextContent('I am newer!');
  });
});