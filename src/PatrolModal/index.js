import React, { memo, useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import timeDistanceInWords from 'date-fns/distance_in_words';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import { getFeedEvents } from '../selectors';
import { removeModal, setModalVisibilityState } from '../ducks/modals';

import EditableItem from '../EditableItem';
import DasIcon from '../DasIcon';
import ReportedBySelect from '../ReportedBySelect';
import DateTimePickerPopover from '../DateTimePickerPopover';
import ReportListItem from '../ReportListItem';
import TimeElapsed from '../TimeElapsed';
import AddReport from '../AddReport';

import HeaderMenuContent from './HeaderMenuContent';
import StatusBadge from './StatusBadge';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { Modal, Header, Body, Footer, AttachmentControls, AttachmentList, LocationSelectorInput } = EditableItem;

const PatrolModal = (props) => {
  const { events, patrol, map } = props;
  const [statePatrol, setStatePatrol] = useState(patrol);

  const eventsToShow = useMemo(() => {
    const cloned = [...events.results];
    cloned.length = Math.min(cloned.length, 5);
    return cloned;
  }, [events]);

  const displayStartTime = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { start_time } = firstLeg;

    return start_time
      ?  new Date(start_time)
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
    const now = new Date();
    const nowTime = now.getTime();

    const hasStarted = !!displayStartTime
    && (displayStartTime.getTime() < nowTime);

    if (!hasStarted) return '0s';

    const hasEnded = !!displayEndTime 
    && (displayEndTime.getTime() <= nowTime);

    if (!hasEnded) {
      return <TimeElapsed date={displayStartTime} />;
    }

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
          start_time: value ? new Date(value).toISOString() : null,
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

  const onPrioritySelect = useCallback((priority) => {
    setStatePatrol({
      ...statePatrol,
      priority,
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
        menuContent={<HeaderMenuContent onPrioritySelect={onPrioritySelect} />}
        priority={displayPriority}
        onTitleChange={onTitleChange}
      >
        <StatusBadge />
      </Header>
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
            <ul>
              {eventsToShow.map((item, index) =>
                <ReportListItem
                  className={styles.listItem}
                  map={map}
                  report={item}
                  key={`${item.id}-${index}`}
                  onTitleClick={() => console.log('title click')}
                  onIconClick={() => console.log('icon click')} />
              )}
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
        <span className={displayDuration !== '0s' ? '' : styles.faded}>
          <strong>Duration:</strong> {displayDuration}
        </span>
        <span className={styles.faded}>
          <strong>Distance:</strong> 0km
        </span>
        <LocationSelectorInput label='' iconPlacement='input' map={map} location={patrolEndLocation} onLocationChange={onEndLocationChange} placeholder='Set End Location' /> 
      </section>
      <AttachmentControls
        onAddFiles={() => console.log('file added')}
        onSaveNote={() => console.log('note saved')}>
        <AddReport map={map} hidePatrols={true} onSaveSuccess={(...args) => console.log('report saved', args)} />
      </AttachmentControls>
      <Footer
        onCancel={() => console.log('cancel')}
        onSave={() => console.log('save')}
        onStateToggle={() => console.log('state toggle')}
        isActiveState={true}
      />
    </Modal>
  </EditableItem>;

};

const mapStateToProps = (state) => ({
  events: getFeedEvents(state),
});
export default connect(mapStateToProps, { setModalVisibilityState })(memo(PatrolModal));

PatrolModal.propTypes = {
  patrol: PropTypes.object.isRequired,
};