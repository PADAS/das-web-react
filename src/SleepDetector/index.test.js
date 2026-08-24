import React from 'react';

import { act, render } from '../test-utils';

import SleepDetector from './';

describe('SleepDetector', () => {
  const INTERVAL = 1000;
  const TOLERANCE = 100;

  const onSleepDetected = jest.fn();

  const setTabHidden = (hidden) => Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: hidden,
  });

  // Advances the wall clock further than the timer, which is what a machine sleeping looks like.
  const sleepFor = (milliseconds) => {
    jest.setSystemTime(Date.now() + milliseconds);

    act(() => jest.advanceTimersByTime(INTERVAL));
  };

  const renderSleepDetector = () => render(
    <SleepDetector interval={INTERVAL} onSleepDetected={onSleepDetected} tolerance={TOLERANCE} />
  );

  beforeEach(() => {
    jest.useFakeTimers();
    onSleepDetected.mockClear();
    setTabHidden(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reports a sleep when a tick arrives later than the tolerance allows', () => {
    renderSleepDetector();

    sleepFor(60 * INTERVAL);

    expect(onSleepDetected).toHaveBeenCalledTimes(1);
  });

  test('does not report a sleep while ticks arrive on time', () => {
    renderSleepDetector();

    act(() => jest.advanceTimersByTime(INTERVAL * 3));

    expect(onSleepDetected).not.toHaveBeenCalled();
  });

  test('does not report a sleep while the tab is hidden', () => {
    renderSleepDetector();
    setTabHidden(true);

    sleepFor(60 * INTERVAL);

    expect(onSleepDetected).not.toHaveBeenCalled();
  });

  test('reports a sleep again once the tab is shown', () => {
    renderSleepDetector();
    setTabHidden(true);

    sleepFor(60 * INTERVAL);
    setTabHidden(false);
    sleepFor(60 * INTERVAL);

    expect(onSleepDetected).toHaveBeenCalledTimes(1);
  });

  test('stops polling once unmounted', () => {
    const { unmount } = renderSleepDetector();

    unmount();
    sleepFor(60 * INTERVAL);

    expect(onSleepDetected).not.toHaveBeenCalled();
  });
});
