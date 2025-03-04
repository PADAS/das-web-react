import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';

import TracksList from '.';

describe('TrackLegend - TracksList', () => {
  const onClose = jest.fn();
  const onRemoveItemTracks = jest.fn();

  const renderTracksList = (props) => render(<TracksList
    items={[]}
    itemsName="items"
    onClose={onClose}
    onRemoveItemTracks={onRemoveItemTracks}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('closes the tracks list', () => {
    renderTracksList();

    expect(onClose).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Close the list of items'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('lists all the items', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('shows the item icon', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    expect(screen.getByAltText('Item 1 icon')).toHaveAttribute('src', 'icon-1');
    expect(screen.getByAltText('Item 2 icon')).toHaveAttribute('src', 'icon-2');
  });

  test('shows the item title', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    expect(screen.getByText('Item 1 title')).toBeVisible();
    expect(screen.getByText('Item 2 title')).toBeVisible();
  });

  test('shows the item description', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    expect(screen.getByText('Item 1 description')).toBeVisible();
    expect(screen.getByText('Item 2 description')).toBeVisible();
  });

  test('removes an item from the tracks list', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    expect(onRemoveItemTracks).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Remove Item 2 title'));

    expect(onRemoveItemTracks).toHaveBeenCalledTimes(1);
    expect(onRemoveItemTracks).toHaveBeenCalledWith('2');
  });
});
