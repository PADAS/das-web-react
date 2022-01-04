import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react';

import TrackToggleButton from './';

const onTrackButtonClick = jest.fn();

test('rendering without crashing', () => {
  render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={true} />);
});

test('call onClick', async () => {
  render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={true} />);
  waitFor(async () => {
    const toggleButton = await screen.getByRole('button');
    userEvent.click(toggleButton);
    expect(onTrackButtonClick).toHaveBeenCalled();
  });
});

describe('styling', () => {
  test('button should contain class pinned if trackPinned is true', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={false} trackPinned={true} />);
    expect(screen.getByRole('button')).toHaveClass('pinned');
  });

  test('button should contain class visible if trackVisible is true', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={false} />);
    expect(screen.getByRole('button')).toHaveClass('visible');
  });

  test('button should not contain pinned or visible classes if both props are set as false', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={false} trackPinned={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('visible');
    expect(screen.getByRole('button')).not.toHaveClass('pinned');
  });
});

describe('show different titles depending on showLabel prop', () => {
  test('show label as pinned', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={true} showLabel={true}/>);
    expect(screen.getByText('Tracks pinned')).toBeTruthy();
  });

  test('show label as on if trackPinned is false', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={false} showLabel={true}/>);
    expect(screen.getByText('Tracks on')).toBeTruthy();
  });

  test('show label as off if trackPinned and trackVisible are false', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={false} trackPinned={false} showLabel={true}/>);
    expect(screen.getByText('Tracks off')).toBeTruthy();
  });

  test('Do not show any label if showLabel is false', () => {
    render(<TrackToggleButton onClick={onTrackButtonClick} trackVisible={true} trackPinned={true} showLabel={false}/>);
    expect(() => screen.getByText('Tracks pinned')).toThrow();
    expect(() => screen.getByText('Tracks on')).toThrow();
    expect(() => screen.getByText('Tracks off')).toThrow();
  });
});