import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';

import TracksList from '.';

describe('TrackLegend - TracksList', () => {
  const onClearItemTracks = jest.fn();
  const onToggleItemChildTracks = jest.fn();

  const renderTracksList = (props) => render(<TracksList
    items={[]}
    onClearItemTracks={onClearItemTracks}
    onToggleItemChildTracks={onToggleItemChildTracks}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists all the items', async () => {
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

  test('shows the item icon', async () => {
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

  test('shows the item title', async () => {
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

  test('shows the item description', async () => {
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

  test('clears the tracks of an item from the tracks list', async () => {
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

    expect(onClearItemTracks).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Clear the tracks of Item 2 title'));

    expect(onClearItemTracks).toHaveBeenCalledTimes(1);
    expect(onClearItemTracks).toHaveBeenCalledWith('2');
  });

  test('lists nothing for a lone item that is made up of no other tracks', () => {
    renderTracksList({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }],
    });

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  describe('an item made up of other tracks', () => {
    const itemWithChildren = {
      children: [{
        description: '3km',
        icon: <img alt="Child 1 icon" src="child-icon-1" />,
        id: 'child1',
        isHidden: false,
        title: 'Child 1 title',
      }, {
        description: '5km',
        icon: <img alt="Child 2 icon" src="child-icon-2" />,
        id: 'child2',
        isHidden: true,
        title: 'Child 2 title',
      }],
      description: 'Item 1 description',
      icon: <img alt="Item 1 icon" src="icon-1" />,
      id: '1',
      title: 'Item 1 title',
    };
    const otherItemWithChildren = {
      children: [{
        description: '8km',
        icon: <img alt="Child 3 icon" src="child-icon-3" />,
        id: 'child3',
        isHidden: false,
        title: 'Child 3 title',
      }],
      description: 'Item 2 description',
      icon: <img alt="Item 2 icon" src="icon-2" />,
      id: '2',
      title: 'Item 2 title',
    };

    test('lists the tracks it is made up of', () => {
      renderTracksList({ items: [itemWithChildren] });

      expect(screen.getByText('Child 1 title')).toBeVisible();
      expect(screen.getByText('3km')).toBeVisible();
      expect(screen.getByText('Child 2 title')).toBeVisible();
      expect(screen.getByText('5km')).toBeVisible();
    });

    test('does not show its own row when it is the only item', () => {
      renderTracksList({ items: [itemWithChildren] });

      expect(screen.queryByText('Item 1 title')).toBeNull();
      expect(screen.queryByLabelText('Clear the tracks of Item 1 title')).toBeNull();
      expect(screen.queryByLabelText('Close the tracks of Item 1 title')).toBeNull();
    });

    test('shows its own row when there are other items', () => {
      renderTracksList({ items: [itemWithChildren, otherItemWithChildren] });

      expect(screen.getByText('Item 1 title')).toBeVisible();
      expect(screen.getByText('Child 1 title')).toBeVisible();
      expect(screen.getByText('Child 3 title')).toBeVisible();
    });

    test('collapses the tracks it is made up of', async () => {
      renderTracksList({ items: [itemWithChildren, otherItemWithChildren] });

      await userEvent.click(screen.getByLabelText('Close the tracks of Item 1 title'));

      expect(screen.getByLabelText('Open the tracks of Item 1 title')).toHaveAttribute('aria-expanded', 'false');
    });

    test('shows which of the tracks it is made up of are hidden', () => {
      renderTracksList({ items: [itemWithChildren] });

      expect(screen.getByLabelText('Hide the track of Child 1 title')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Show the track of Child 2 title')).toHaveAttribute('aria-pressed', 'false');
    });

    test('toggles one of the tracks it is made up of', async () => {
      renderTracksList({ items: [itemWithChildren] });

      await userEvent.click(screen.getByLabelText('Hide the track of Child 1 title'));

      expect(onToggleItemChildTracks).toHaveBeenCalledTimes(1);
      expect(onToggleItemChildTracks).toHaveBeenCalledWith('1', 'child1');
    });
  });
});
