import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import MapLegend from '.';

describe('MapLegend', () => {
  const onClose = jest.fn();
  const renderSettings = jest.fn();
  const renderTitle = jest.fn();

  const renderMapLegend = (props) => render(<MapLegend
    onClose={onClose}
    renderSettings={renderSettings}
    renderTitle={renderTitle}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the title from the render prop', () => {
    renderMapLegend({ renderTitle: () => <div data-testid="title">Title</div> });

    expect(screen.getByTestId('title')).toBeVisible();
  });

  test('closes the map legend when clicking the close button', () => {
    renderMapLegend();

    expect(onClose).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByRole('button')[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('shows a settings button if the render settings prop is defined', () => {
    renderMapLegend();

    expect(screen.getAllByRole('button')[1]).toBeVisible();
  });

  test('does not show a settings button if the render settings prop is not defined', () => {
    renderMapLegend({ renderSettings: null });

    expect(screen.getAllByRole('button')[1]).toBeUndefined();
  });

  test('renders the settings from the render prop in a popover', () => {
    renderMapLegend({ renderSettings: () => <div data-testid="settings">Settings</div> });

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.queryByTestId('settings')).toBeNull();

    userEvent.click(screen.getAllByRole('button')[1]);

    expect(screen.getByRole('tooltip')).toBeVisible();
    expect(screen.getByTestId('settings')).toBeVisible();
  });
});
