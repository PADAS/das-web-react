import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import Overlay from 'react-bootstrap/Overlay';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as CheckIcon } from '../common/images/icons/check-light.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as PauseIcon } from '../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../common/images/icons/play.svg';

import { BREAKPOINTS } from '../constants';
import { calcSidebarPaddingLeft } from '../utils/map';
import {
  clearVirtualDate,
  setVirtualDate,
  setTimeSliderState,
} from '../ducks/timeslider';
import dateLocales from '../utils/locales';
import {
  format,
  SHORT_TIME_FORMAT,
  SHORTENED_DATE_FORMAT,
  STANDARD_DATE_FORMAT,
} from '../utils/datetime';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import {
  MAP_INTERACTION_CATEGORY,
  trackEventFactory,
} from '../utils/analytics';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { useMatchMedia } from '../hooks';

import EventFilterDateRange from '../EventFilter/DateRange';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const PLAYBACK_DURATION_MS = 30_000;
export const FRAME_INTERVAL_MS = 33; // ~30fps
const FRAME_STEP_FRACTION = FRAME_INTERVAL_MS / PLAYBACK_DURATION_MS;

const DEFAULT_PLAYBACK_SPEED = 1;
const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const trackDateChange = () => mapInteractionTracker.track('Update Time Slider Date Range');

const isAtEnd = (value) => value >= 0.99999;

const TimeSlider = () => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('components', { keyPrefix: 'timeSlider' });
  const location = useLocation();

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const eventFilterLowerDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const eventFilterUpperDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.upper);
  const virtualDate = useSelector((state) => state.view.timeSliderState.virtualDate);

  const speedMenuItemOptionRefs = useRef([]);

  const speedMenuPopoverId = useId();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_PLAYBACK_SPEED);
  const [speedMenuAnchorEl, setSpeedMenuAnchorEl] = useState();

  const sidebarOffsetPixels = calcSidebarPaddingLeft({
    isMediumLayoutOrLarger,
    pathname: location.pathname,
  }) ?? 0;

  const isCompact = sidebarOffsetPixels > 0;

  const debouncedRangeChangeAnalytics = useMemo(() => mapInteractionTracker.debouncedTrack(300), []);

  const endDate = useMemo(
    () => eventFilterUpperDateRange
      ? new Date(eventFilterUpperDateRange)
      : new Date(),
    [eventFilterUpperDateRange],
  );
  const startDate = useMemo(() => new Date(eventFilterLowerDateRange), [eventFilterLowerDateRange]);

  const endDateFormatted = format(new Date(endDate), STANDARD_DATE_FORMAT, { locale: dateLocales[i18n.language] });
  const startDateFormatted = format(
    new Date(startDate),
    STANDARD_DATE_FORMAT,
    { locale: dateLocales[i18n.language] },
  );

  const currentDate = virtualDate ? new Date(virtualDate) : endDate;

  const playbackSpeedOption = PLAYBACK_SPEED_OPTIONS.find(
    (option) => option.value === playbackSpeed
  );

  const sliderValue = (currentDate - startDate) / (endDate - startDate);

  // Copies of the current slider value and playback speed to avoid the
  // useEffect unmounting on every frame or speed change.
  const sliderValueRef = useRef();
  const playbackSpeedRef = useRef();
  /* eslint-disable react-hooks/refs */
  sliderValueRef.current = sliderValue;
  playbackSpeedRef.current = playbackSpeed;
  /* eslint-enable react-hooks/refs */

  const isEventFilterLowerDateRangeDateModified = !isEqual(
    INITIAL_FILTER_STATE.filter.date_range.lower,
    eventFilterLowerDateRange,
  );
  const isEventFilterUpperDateRangeDateModified = !isEqual(
    INITIAL_FILTER_STATE.filter.date_range.upper,
    eventFilterUpperDateRange,
  );
  const isEventFilterDateRangeModified = isEventFilterLowerDateRangeDateModified
    || isEventFilterUpperDateRangeDateModified;

  const setVirtualDateFromSliderValue = useCallback((sliderValue) => {
    if (isAtEnd(sliderValue)) {
      if (eventFilterUpperDateRange) {
        dispatch(setVirtualDate(eventFilterUpperDateRange));
      } else {
        dispatch(clearVirtualDate());
      }
    } else {
      const sliderValueOffsetTime = (endDate - startDate) * sliderValue;
      const nextVirtualDateTime = startDate.getTime() + sliderValueOffsetTime;
      const nextVirtualDate = new Date(nextVirtualDateTime);
      dispatch(setVirtualDate(nextVirtualDate.toISOString()));
    }
  }, [dispatch, endDate, eventFilterUpperDateRange, startDate]);

  const onClickPlayStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (isAtEnd(sliderValue)) {
        // The range value is at the end of the range, place it at the first
        // frame.
        const frameStepFractionTime = (endDate - startDate) * FRAME_STEP_FRACTION * playbackSpeed;
        const firstFrameTime = startDate.getTime() + frameStepFractionTime;
        const firstFrameDate = new Date(firstFrameTime);
        dispatch(setVirtualDate(firstFrameDate.toISOString()));
      }

      setIsPlaying(true);
    }
  };

  const onSpeedMenuClose = () => {
    setIsSpeedMenuOpen(false);

    speedMenuAnchorEl?.focus();
  };

  const onSpeedMenuKeyDown = (event) => {
    const currentOptionIndex = speedMenuItemOptionRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );

    switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();

      const nextOptionIndex = (currentOptionIndex + 1) % speedMenuItemOptionRefs.current.length;
      speedMenuItemOptionRefs.current[nextOptionIndex]?.focus();

      break;
    }

    case 'ArrowUp': {
      event.preventDefault();

      const previousOptionIndex = (currentOptionIndex - 1 + speedMenuItemOptionRefs.current.length)
        % speedMenuItemOptionRefs.current.length;
      speedMenuItemOptionRefs.current[previousOptionIndex]?.focus();

      break;
    }

    case 'End':
      event.preventDefault();

      speedMenuItemOptionRefs.current[speedMenuItemOptionRefs.current.length - 1]?.focus();

      break;

    case 'Home':
      event.preventDefault();

      speedMenuItemOptionRefs.current[0]?.focus();

      break;

    case 'Tab':
      onSpeedMenuClose();

      break;

    case 'Escape':
      event.preventDefault();

      onSpeedMenuClose();

      break;

    default:
    }
  };

  const onSpeedMenuOptionClick = (speed) => {
    setPlaybackSpeed(speed);

    onSpeedMenuClose();
  };

  const onChangeSlider = (event) => {
    setVirtualDateFromSliderValue(event.target.value);
    setIsPlaying(false);

    debouncedRangeChangeAnalytics('Changed \'Time Slider\'');
  };

  const onClickReset = (event) => {
    event.stopPropagation();

    dispatch(resetGlobalDateRange());
    trackDateChange();
  };

  useEffect(() => {
    if (isSpeedMenuOpen) {
      // The speed menu is open. Focus the selected speed menu item option.
      const selectedSpeedMenuItemOptionIndex = PLAYBACK_SPEED_OPTIONS.findIndex(
        (option) => option.value === playbackSpeed
      );
      speedMenuItemOptionRefs.current[selectedSpeedMenuItemOptionIndex]?.focus();
    }
  }, [isSpeedMenuOpen, playbackSpeed]);

  useEffect(() => {
    if (isCompact) {
      // The time slider is in compact mode. Close the speed menu.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSpeedMenuOpen(false);
    }
  }, [isCompact]);

  useEffect(() => {
    // Reset the virtual date to the end of the range when the event filter
    // date range is changed.
    setVirtualDateFromSliderValue(1);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilterLowerDateRange, eventFilterUpperDateRange]);

  useEffect(() => {
    if (isPlaying) {
      // Playing mode is active, automatically advance the virtual date by
      // intervals.
      const intervalId = setInterval(() => {
        const nextValue = sliderValueRef.current + (FRAME_STEP_FRACTION * playbackSpeedRef.current);

        setVirtualDateFromSliderValue(nextValue);

        if (isAtEnd(nextValue)) {
          setIsPlaying(false);
        }
      }, FRAME_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, setVirtualDateFromSliderValue]);

  useEffect(() => () => debouncedRangeChangeAnalytics.cancel(), [debouncedRangeChangeAnalytics]);

  return <div
      className={`${styles.wrapper} ${isCompact ? styles.compact : ''}`}
      data-testid="timeSlider-wrapper"
      style={{ '--sidebar-offset': `${sidebarOffsetPixels}px` }}
    >
    <button
      aria-label={isPlaying ? t('stopButtonLabel') : t('playButtonLabel')}
      className={styles.playStopButton}
      onClick={onClickPlayStop}
      title={isPlaying ? t('stopButtonLabel') : t('playButtonLabel')}
      type="button"
    >
      {isPlaying ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
    </button>

    {!isCompact && <>
      <button
        aria-controls={speedMenuPopoverId}
        aria-expanded={isSpeedMenuOpen}
        aria-haspopup="menu"
        aria-label={t('speedButtonLabel')}
        className={styles.speedButton}
        onClick={() => setIsSpeedMenuOpen((isOpen) => !isOpen)}
        ref={setSpeedMenuAnchorEl}
        title={t('speedButtonLabel')}
        type="button"
      >
        {playbackSpeedOption.label}
      </button>

      <Overlay
        onHide={() => setIsSpeedMenuOpen(false)}
        rootClose
        show={isSpeedMenuOpen}
        target={speedMenuAnchorEl}
      >
        <Popover className={styles.speedMenuPopover} role="presentation">
          <div aria-hidden="true" className={styles.speedMenuHeader}>{t('speedMenuHeader')}</div>

          <ul
            aria-label={t('speedMenuLabel')}
            className={styles.speedMenu}
            id={speedMenuPopoverId}
            onKeyDown={onSpeedMenuKeyDown}
            role="menu"
          >
            {PLAYBACK_SPEED_OPTIONS.map((option, index) => <li
              className={styles.speedMenuItem}
              key={option.value}
              role="none"
            >
              <button
                aria-checked={playbackSpeed === option.value}
                aria-label={t('speedMenuOptionLabel', { speed: option.label })}
                className={styles.speedMenuItemOption}
                onClick={() => onSpeedMenuOptionClick(option.value)}
                ref={(element) => {
                  speedMenuItemOptionRefs.current[index] = element;
                }}
                role="menuitemradio"
                tabIndex={-1}
                title={t('speedMenuOptionLabel', { speed: option.label })}
                type="button"
              >
                {playbackSpeed === option.value && <CheckIcon className={styles.checkIcon} />}

                {option.label}
              </button>
            </li>)}
          </ul>
        </Popover>
      </Overlay>
    </>}

    <time className={styles.virtualDateWrapper} dateTime={currentDate.toISOString()}>
      <span className={styles.virtualTime}>
        {format(currentDate, SHORT_TIME_FORMAT, { locale: dateLocales[i18n.language] })}
      </span>

      <span className={styles.virtualDate}>
        {format(currentDate, SHORTENED_DATE_FORMAT, { locale: dateLocales[i18n.language] })}
      </span>
    </time>

    <div aria-hidden="true" className={styles.separator} />

    <div className={styles.track}>
      <input
        aria-label={t('sliderLabel')}
        aria-valuetext={format(
          currentDate,
          STANDARD_DATE_FORMAT,
          { locale: dateLocales[i18n.language] },
        )}
        className={styles.slider}
        max="1"
        min="0"
        onChange={onChangeSlider}
        step="any"
        type="range"
        value={sliderValue}
      />

      <div aria-hidden="true" className={styles.sliderLabels}>
        <span data-testid="timeSlider-startDate">{startDateFormatted}</span>

        <span className={styles.endDate} data-testid="timeSlider-endDate">
          {!eventFilterUpperDateRange && <span aria-hidden="true" className={styles.nowDot} />}

          {eventFilterUpperDateRange ? endDateFormatted : t('endDateNowSliderLabel')}
        </span>
      </div>
    </div>

    <OverlayTrigger
      overlay={
        <Popover className={styles.popover}>
          <Popover.Header className={styles.popoverTitle}>
            <ClockIcon aria-hidden="true" />

            {t('popoverHeader')}

            <Button
              disabled={!isEventFilterDateRangeModified}
              onClick={onClickReset}
              size="sm"
              type="button"
              variant="light"
            >
              {t('popoverResetButton')}
            </Button>
          </Popover.Header>

          <Popover.Body className={styles.popoverBody}>
            <EventFilterDateRange
              endDateLabel=""
              onEndChange={() => trackDateChange()}
              onStartChange={() => trackDateChange()}
              placement="top"
              popoverClassName={styles.dateRangePopover}
              startDateLabel=""
            />
          </Popover.Body>
        </Popover>
      }
      rootClose
      trigger="click"
    >
      <button
        aria-label={t('dateRangeButtonLabel')}
        className={`${styles.dateRangeButton} ${isEventFilterDateRangeModified ? styles.modified : ''}`}
        title={t('dateRangeButtonLabel')}
        type="button"
      >
        <CalendarIcon aria-hidden="true" />
      </button>
    </OverlayTrigger>

    {!isCompact && <button
      aria-label={t('closeButtonLabel')}
      className={styles.closeButton}
      onClick={() => dispatch(setTimeSliderState(false))}
      title={t('closeButtonLabel')}
      type="button"
    >
      <CrossIcon aria-hidden="true" />
    </button>}
  </div>;
};

export default memo(TimeSlider);
