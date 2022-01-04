import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react';

import HeatmapToggleButton from './';

const onButtonClick = jest.fn();

test('rendering without crashing', () => {
  render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={true} />);
});

test('call onClick', async () => {
  render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={true} />);
  waitFor(async () => {
    const toggleButton = await screen.getByRole('button');
    userEvent.click(toggleButton);
    expect(onButtonClick).toHaveBeenCalled();
  });
});

describe('styling', () => {
  test('button should contain class visible if heatmapVisible is true', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={true} />);
    expect(screen.getByRole('button')).toHaveClass('visible');
    expect(screen.getByRole('button')).not.toHaveClass('partial');
  });

  test('button should contain class partial if heatmapPartiallyVisible is true', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={false} heatmapPartiallyVisible={true} />);
    expect(screen.getByRole('button')).toHaveClass('partial');
    expect(screen.getByRole('button')).not.toHaveClass('visible');
  });

  test('button should not contain partial or visible classes if heatmapVisible is false', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('visible');
    expect(screen.getByRole('button')).not.toHaveClass('partial');
  });
});

describe('show different titles depending on showLabel prop', () => {
  test('show label as on if heatmapVisible is true', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={true} showLabel={true}/>);
    expect(screen.getByText('Heatmap on')).toBeTruthy();
  });

  test('show label as off if heatmapVisible is false', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={false} heatmapPartiallyVisible={false} showLabel={true}/>);
    expect(screen.getByText('Heatmap off')).toBeTruthy();
  });

  test('Do not show any label if showLabel is false', () => {
    render(<HeatmapToggleButton onClick={onButtonClick} heatmapVisible={true} showLabel={false}/>);
    expect(() => screen.getByText('Heatmap on')).toThrow();
    expect(() => screen.getByText('Heatmap off')).toThrow();
  });
});