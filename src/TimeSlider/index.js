import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import Overlay from 'react-bootstrap/Overlay';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as PauseIcon } from '../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../common/images/icons/play.svg';

import { BREAKPOINTS, POPOVER_POPPER_CONFIG } from '../constants';
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
  TrackerContext,
  trackEventFactory,
} from '../utils/analytics';
import { selectOtusTabWidth } from '../selectors/otus';
import { useMatchMedia } from '../hooks';
import useMenuToggle from '../hooks/useMenuToggle';

import DateRangePopover from '../EventFilter/DateRangePopover';
import Menu from '../Menu';

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

const isAtEnd = (value) => value >= 0.99999;

const TimeSlider = () => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('components', { keyPrefix: 'timeSlider' });
  const location = useLocation();

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const speedMenuToggle = useMenuToggle();

  const eventFilterLowerDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const eventFilterUpperDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.upper);
  const otusTabWidth = useSelector(selectOtusTabWidth);
  const virtualDate = useSelector((state) => state.view.timeSliderState.virtualDate);

  const dateRangePopoverId = useId();

  const [dateRangeButtonAnchor, setDateRangeButtonAnchor] = useState(null);
  const [isDateRangePopoverOpen, setIsDateRangePopoverOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_PLAYBACK_SPEED);

  const sidebarOffsetPixels = calcSidebarPaddingLeft({
    isMediumLayoutOrLarger,
    otusTabWidth,
    pathname: location.pathname,
  }) ?? 0;

  const isCompact = sidebarOffsetPixels > 0;

  const hideSpeedMenu = speedMenuToggle.menuProps.onHide;

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

  const onChangeSlider = (event) => {
    setVirtualDateFromSliderValue(event.target.value);
    setIsPlaying(false);

    debouncedRangeChangeAnalytics('Changed \'Time Slider\'');
  };

  const hideDateRangePopover = useCallback(() => setIsDateRangePopoverOpen(false), []);

  useEffect(() => {
    // The compact slider drops the speed button, so its menu would come back
    // open when the slider widens again.
    if (isCompact) {
      hideSpeedMenu();
    }
  }, [hideSpeedMenu, isCompact]);

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
        aria-label={t('speedButtonLabel')}
        className={styles.speedButton}
        title={t('speedButtonLabel')}
        type="button"
        {...speedMenuToggle.toggleProps}
      >
        {playbackSpeedOption.label}
      </button>

      <Menu
        aria-label={t('speedMenuLabel')}
        className={styles.speedMenu}
        header={t('speedMenuHeader')}
        placement="top"
        {...speedMenuToggle.menuProps}
      >
        {PLAYBACK_SPEED_OPTIONS.map((option) => <Menu.Option
          aria-checked={playbackSpeed === option.value}
          aria-label={t('speedMenuOptionLabel', { speed: option.label })}
          key={option.value}
          onClick={() => setPlaybackSpeed(option.value)}
          role="menuitemradio"
          title={t('speedMenuOptionLabel', { speed: option.label })}
        >
          {option.label}
        </Menu.Option>)}
      </Menu>
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

    <button
      aria-controls={isDateRangePopoverOpen ? dateRangePopoverId : undefined}
      aria-expanded={isDateRangePopoverOpen}
      aria-haspopup="dialog"
      aria-label={t('dateRangeButtonLabel')}
      className={`${styles.dateRangeButton} ${isEventFilterDateRangeModified ? styles.active : ''}`}
      onClick={() => setIsDateRangePopoverOpen((isOpen) => !isOpen)}
      ref={setDateRangeButtonAnchor}
      title={t('dateRangeButtonLabel')}
      type="button"
    >
      <CalendarIcon aria-hidden="true" />
    </button>

    <TrackerContext.Provider value={mapInteractionTracker}>
      <Overlay
        placement="top"
        popperConfig={POPOVER_POPPER_CONFIG}
        show={isDateRangePopoverOpen}
        target={dateRangeButtonAnchor}
      >
        <DateRangePopover id={dateRangePopoverId} onClose={hideDateRangePopover} trigger={dateRangeButtonAnchor} />
      </Overlay>
    </TrackerContext.Provider>

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
