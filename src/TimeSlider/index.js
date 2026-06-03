import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import isEqual from 'react-fast-compare';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as PauseIcon } from '../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../common/images/icons/play.svg';

import {
  clearVirtualDate,
  setVirtualDate,
  setTimeSliderState,
} from '../ducks/timeslider';
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
import dateLocales from '../utils/locales';

import EventFilterDateRange from '../EventFilter/DateRange';

import * as styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const PLAYBACK_DURATION_MS = 30_000;
const FRAME_INTERVAL_MS = 66; // ~15fps
const FRAME_STEP_FRACTION = FRAME_INTERVAL_MS / PLAYBACK_DURATION_MS;

const trackDateChange = () => mapInteractionTracker.track('Update Time Slider Date Range');

const isAtEnd = (value) => value >= 0.99999;

const TimeSlider = ({ className }) => {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation('components', { keyPrefix: 'timeSlider' });

  const eventFilterLowerDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.lower);
  const eventFilterUpperDateRange = useSelector((state) => state.data.eventFilter.filter.date_range.upper);
  const virtualDate = useSelector((state) => state.view.timeSliderState.virtualDate);

  const [isPlaying, setIsPlaying] = useState(false);

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

  const rangeValue = (currentDate - startDate) / (endDate - startDate);

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

  const setVirtualDateFromRangeValue = useCallback((rangeValue) => {
    if (isAtEnd(rangeValue)) {
      if (eventFilterUpperDateRange) {
        dispatch(setVirtualDate(eventFilterUpperDateRange));
      } else {
        dispatch(clearVirtualDate());
      }
    } else {
      const rangeValueOffsetTime = (endDate - startDate) * rangeValue;
      const nextVirtualDateTime = startDate.getTime() + rangeValueOffsetTime;
      const nextVirtualDate = new Date(nextVirtualDateTime);
      dispatch(setVirtualDate(nextVirtualDate.toISOString()));
    }
  }, [dispatch, endDate, eventFilterUpperDateRange, startDate]);

  const onClickPlayStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (isAtEnd(rangeValue)) {
        // The range value is at the end of the range, place it at the first
        // frame.
        const frameStepFractionTime = (endDate - startDate) * FRAME_STEP_FRACTION;
        const firstFrameTime = startDate.getTime() + frameStepFractionTime;
        const firstFrameDate = new Date(firstFrameTime);
        dispatch(setVirtualDate(firstFrameDate.toISOString()));
      }

      setIsPlaying(true);
    }
  };

  const onChangeRange = (event) => {
    setVirtualDateFromRangeValue(event.target.value);
    setIsPlaying(false);

    debouncedRangeChangeAnalytics('Changed \'Time Slider\'');
  };

  const onClickReset = (event) => {
    event.stopPropagation();

    dispatch(resetGlobalDateRange());
    trackDateChange();
  };

  useEffect(() => {
    // Reset the virtual date to the end of the range when the event filter
    // date range is changed.
    setVirtualDateFromRangeValue(1);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilterLowerDateRange, eventFilterUpperDateRange]);

  useEffect(() => {
    if (isPlaying) {
      // Playing mode is active, automatically advance the virtual date by
      // intervals.
      const intervalId = setInterval(() => {
        const nextValue = rangeValue + FRAME_STEP_FRACTION;

        setVirtualDateFromRangeValue(nextValue);

        if (isAtEnd(nextValue)) {
          setIsPlaying(false);
        }
      }, FRAME_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, rangeValue, setVirtualDateFromRangeValue]);

  useEffect(() => () => debouncedRangeChangeAnalytics.cancel(), [debouncedRangeChangeAnalytics]);

  return <div className={styles.wrapper}>
    <button
      aria-label={isPlaying ? t('stopButtonLabel') : t('playButtonLabel')}
      className={styles.playStopButton}
      onClick={onClickPlayStop}
      title={isPlaying ? t('stopButtonLabel') : t('playButtonLabel')}
      type="button"
    >
      {isPlaying ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
    </button>

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
        onChange={onChangeRange}
        step="any"
        type="range"
        value={rangeValue}
      />

      <div aria-hidden="true" className={styles.sliderLabels}>
        <span>{startDateFormatted}</span>

        <span className={styles.nowLabel}>
          {!eventFilterUpperDateRange && <span aria-hidden="true" className={styles.nowDot} />}

          {eventFilterUpperDateRange ? endDateFormatted : t('endDateNowSliderLabel')}
        </span>
      </div>
    </div>

    <OverlayTrigger
      overlay={
        <Popover className={`${styles.popover} ${className}`}>
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

    <button
      aria-label={t('closeButtonLabel')}
      className={styles.closeButton}
      onClick={() => dispatch(setTimeSliderState(false))}
      title={t('closeButtonLabel')}
      type="button"
    >
      <CrossIcon aria-hidden="true" />
    </button>
  </div>;
};

export default memo(TimeSlider);
