import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FeedListItem from './';


test('rendering without crashing', () => {
  render(<FeedListItem
    themeColor='red'
    IconComponent={<div data-testid='icon'>I am in an icon slot how rude of me</div>}
    TitleComponent={<h3>I am the title</h3>}
    DateComponent={<span>Time for you to get a grip pal</span>}
    ControlsComponent={<button type='button'>nice button</button>}
   />);

  cleanup();
});


beforeEach(() => {
  render(<FeedListItem
    themeColor='red'
    IconComponent={<div data-testid='icon'>I am in an icon slot how rude of me</div>}
    TitleComponent={<h3>I am the title</h3>}
    DateComponent={<span>Time for you to get a grip pal</span>}
    ControlsComponent={<button type='button'>nice button</button>}
   />);
});

describe('the feed list item component', () => {
  test('rendering an icon component slot', async () => {
    const iconContainer = await screen.findByRole('img');
    expect(iconContainer).toHaveTextContent('I am in an icon slot how rude of me');
  });

  test('the icon slot background theme color', async () => {
    const iconContainer = await screen.findByRole('img');
    expect(iconContainer).toHaveStyle('background-color: red');
  });

  test('rendering a title component slot', async () => {
    const titleContainer = await screen.findByTestId('feed-list-item-title-container');
    expect(titleContainer).toHaveTextContent('I am the title');
  });

  test('rendering a date component slot', async () => {
    const dateContainer = await screen.findByTestId('feed-list-item-date-container');
    expect(dateContainer).toHaveTextContent('Time for you to get a grip pal');
  });

  test('rendering a controls component slot', async () => {
    const controlsContainer = await screen.findByTestId('feed-list-item-controls-container');
    expect(controlsContainer).toHaveTextContent('nice button');
  });
});