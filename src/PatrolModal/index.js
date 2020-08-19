import React, { memo, useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import timeDistanceInWords from 'date-fns/distance_in_words';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import { removeModal, setModalVisibilityState } from '../ducks/modals';

import EditableItem from '../EditableItem';
import DasIcon from '../DasIcon';
import ReportedBySelect from '../ReportedBySelect';
import DateTimePickerPopover from '../DateTimePickerPopover';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { Modal, Header, Body, Footer, AttachmentControls, AttachmentList, LocationSelectorInput } = EditableItem;

const PatrolModal = (props) => {
  const { patrol, map } = props;
  const [statePatrol, setStatePatrol] = useState(patrol);

  const displayStartTime = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { scheduled_start, start_time } = firstLeg;

    return start_time || scheduled_start
      ?  new Date(start_time || scheduled_start)
      : null;
    
  }, [statePatrol.patrol_segments]);

  const displayEndTime = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { end_time } = firstLeg;

    return end_time
      ?  new Date(end_time)
      : null;
    
  }, [statePatrol.patrol_segments]);

  const displayDuration = useMemo(() => {
    if (!displayStartTime || !displayEndTime) return 0;
    return timeDistanceInWords(displayStartTime, displayEndTime);
  }, [displayEndTime, displayStartTime]);

  const displayTrackingSubject = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { sources } = firstLeg;
    if (!sources || !sources.length) return null;
    return sources[0];
  }, [statePatrol.patrol_segments]);

  const onTitleChange = useCallback((value) => {
    setStatePatrol({
      ...statePatrol,
      title: value,
    });
  }, [statePatrol]);

  const onStartLocationChange = useCallback((value) => {
    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          start_location: value ? {
            lng: value[0],
            lat: value[1],
          } : null,
        },
      ],
    });
  }, [statePatrol]);


  const onEndLocationChange = useCallback((value) => {
    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          end_location: value ? {
            lng: value[0],
            lat: value[1],
          } : null,
        },
      ],
    });
  }, [statePatrol]);

  const onStartTimeChange = useCallback((value) => {
    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          scheduled_start: value ? new Date(value).toISOString() : null,
        },
      ],
    });
  }, [statePatrol]);

  const onEndTimeChange = useCallback((value) => {
    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          end_time: value ? new Date(value).toISOString() : null,
        },
      ],
    });
  }, [statePatrol]);

  const onSelectTrackedSubject = useCallback((value) => {
    const trackedSubjectLocation = value
      && value.last_position 
      && value.last_position.geometry 
      && value.last_position.geometry.coordinates;

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          sources: value ? [value] : null,
          start_location: !!trackedSubjectLocation ? {
            lat: trackedSubjectLocation[1],
            lng: trackedSubjectLocation[0],
          } : statePatrol.patrol_segments[0].start_location,
        },
      ],
    });
  }, [statePatrol]);

  const patrolStartLocation = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;

    const [firstLeg] = statePatrol.patrol_segments;

    if (!firstLeg.start_location) return null;
    return [firstLeg.start_location.lng, firstLeg.start_location.lat];
  }, [statePatrol.patrol_segments]);

  const patrolEndLocation = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;

    const [firstLeg] = statePatrol.patrol_segments;

    if (!firstLeg.end_location) return null;
    return [firstLeg.end_location.lng, firstLeg.end_location.lat];
  }, [statePatrol.patrol_segments]);

  const displayPriority = useMemo(() => {
    if (statePatrol.priority) return statePatrol.priority;
    if (!!statePatrol.patrol_segments.length) return statePatrol.patrol_segments[0].priority;
    return null;
  }, [statePatrol.patrol_segments, statePatrol.priority]);

  return <EditableItem data={statePatrol}>
    <Modal>
      <Header 
        icon={<DasIcon type='events' iconId='fence-patrol-icon' />}
        menuContent={null}
        priority={displayPriority}
        onTitleChange={onTitleChange}
      />
      <div className={styles.topControls}>
        <label>
          Tracking:
          <ReportedBySelect className={styles.reportedBySelect} value={displayTrackingSubject} onChange={onSelectTrackedSubject} />
        </label>
      </div>
      <section className={`${styles.timeBar} ${styles.start}`}>
        <div>
          <h6>Start</h6>
          <DateTimePickerPopover
            {...DATEPICKER_DEFAULT_CONFIG}
            value={displayStartTime}
            className={!!displayStartTime ? styles.timeInput : `${styles.timeInput} ${styles.empty}`}
            showClockIcon={true}
            placement='bottom'
            placeholder='Set Start Time'
            // required={true}
            // popoverClassName={styles.datePopover}
            // maxDate={}
            onChange={onStartTimeChange}  />
        </div>
        <LocationSelectorInput label='' iconPlacement='input' map={map} location={patrolStartLocation} onLocationChange={onStartLocationChange} placeholder='Set Start Location' />
      </section>
      <Body className={styles.body}>
        <ul className={styles.segmentList}>
          <li className={styles.segment}>
            This is where a report segment, currently represented in the UI as a list of contained reports, would live.
            <ul>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
            </ul>
          </li>
        </ul>
        <AttachmentList
          files={statePatrol.files}
          notes={statePatrol.notes}
          onClickFile={() => console.log('file click')}
          onClickNote={() => console.log('note click')}
          onDeleteNote={() => console.log('note delete')}
          onDeleteFile={() => console.log('file delete')} />
      </Body>
      <section className={`${styles.timeBar} ${styles.end}`}>
        <div>
          <h6>End</h6>
          <DateTimePickerPopover
            className={!!displayEndTime ? styles.timeInput : `${styles.timeInput} ${styles.empty}`}
            showClockIcon={true}
            {...DATEPICKER_DEFAULT_CONFIG}
            value={displayEndTime}
            placement='top'
            placeholder='Set End Time'
            // popoverClassName={styles.datePopover}
            // required={true}
            minDate={displayStartTime || DATEPICKER_DEFAULT_CONFIG.minDate}
            defaultValue={displayStartTime || null}
            maxDate={null}
            onChange={onEndTimeChange}  />
        </div>
        <span className={!!displayDuration ? '' : styles.faded}>
          <strong>Duration:</strong> {displayDuration}
        </span>
        <span>
          <strong>Distance:</strong> 0km
        </span>
        <LocationSelectorInput label='' iconPlacement='input' map={map} location={patrolEndLocation} onLocationChange={onEndLocationChange} placeholder='Set End Location' /> 
      </section>
      <AttachmentControls
        onAddFiles={() => console.log('file added')}
        onSaveNote={() => console.log('note saved')} />
      <Footer
        onCancel={() => console.log('cancel')}
        onSave={() => console.log('save')}
        onStateToggle={() => console.log('state toggle')}
        isActiveState={true}
      />
    </Modal>
  </EditableItem>;

};

export default connect(null, { setModalVisibilityState })(memo(PatrolModal));

PatrolModal.propTypes = {
  patrol: PropTypes.object.isRequired,
};