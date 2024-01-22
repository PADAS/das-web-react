import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import TrackToggleButton from './';
import i18nForTests from '../i18nForTests';

const onTrackButtonClick = jest.fn();


const renderTrackToggleButton = (trackVisible = true, trackPinned = true, showLabel = true) => render(
  <I18nextProvider i18n={i18nForTests}>
    <TrackToggleButton onClick={onTrackButtonClick} trackVisible={trackVisible} trackPinned={trackPinned} showLabel={showLabel} />
  </I18nextProvider>
);

test('rendering without crashing', () => {
  renderTrackToggleButton();
});

test('call onClick', () => {
  renderTrackToggleButton();
  waitFor(async () => {
    const toggleButton = await screen.getByRole('button');
    userEvent.click(toggleButton);
    expect(onTrackButtonClick).toHaveBeenCalled();
  });
});

describe('styling', () => {
  test('button should contain class pinned if trackPinned is true', () => {
    renderTrackToggleButton(false);
    expect(screen.getByRole('button')).toHaveClass('pinned');
  });

  test('button should contain class visible if trackVisible is true', () => {
    renderTrackToggleButton(true, false);
    expect(screen.getByRole('button')).toHaveClass('visible');
  });

  test('button should not contain pinned or visible classes if both props are set as false', () => {
    renderTrackToggleButton(false, false);
    expect(screen.getByRole('button')).not.toHaveClass('visible');
    expect(screen.getByRole('button')).not.toHaveClass('pinned');
  });
});

describe('show different titles depending on showLabel prop', () => {
  test('show label as pinned', () => {
    renderTrackToggleButton();
    expect(screen.getByText('Tracks pinned')).toBeTruthy();
  });

  test('show label as on if trackPinned is false', () => {
    renderTrackToggleButton(true, false);
    expect(screen.getByText('Tracks on')).toBeTruthy();
  });

  test('show label as off if trackPinned and trackVisible are false', () => {
    renderTrackToggleButton(false, false);
    expect(screen.getByText('Tracks off')).toBeTruthy();
  });

  test('Do not show any label if showLabel is false', () => {
    renderTrackToggleButton(true, true, false);
    expect(() => screen.getByText('Tracks pinned')).toThrow();
    expect(() => screen.getByText('Tracks on')).toThrow();
    expect(() => screen.getByText('Tracks off')).toThrow();
  });
});