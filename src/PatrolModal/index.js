import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePermissions } from '../hooks';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isFuture from 'date-fns/is_future';
import isPast from 'date-fns/is_past';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import merge from 'lodash/merge';
import orderBy from 'lodash/orderBy';

import { createPatrolDataSelector } from '../selectors/patrols';
import { addModal, removeModal, setModalVisibilityState } from '../ducks/modals';
import { updateUserPreferences } from '../ducks/user-preferences';
import { filterDuplicateUploadFilenames, fetchImageAsBase64FromUrl } from '../utils/file';
import { downloadFileFromUrl } from '../utils/download';
import { addPatrolSegmentToEvent, getEventIdsForCollection } from '../utils/events';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { subjectIsARadio, radioHasRecentActivity } from '../utils/subjects';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { fetchTrackedBySchema } from '../ducks/trackedby';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, calcPatrolCardState, displayTitleForPatrol, displayStartTimeForPatrol, displayEndTimeForPatrol, displayDurationForPatrol,
  isSegmentActive, displayPatrolSegmentId, getReportsForPatrol, isSegmentEndScheduled, patrolTimeRangeIsValid, patrolShouldBeMarkedDone, patrolShouldBeMarkedOpen,
  iconTypeForPatrol, extractAttachmentUpdates } from '../utils/patrols';

import { trackEvent } from '../utils/analytics';


import { PATROL_CARD_STATES, REPORT_PRIORITIES, PERMISSION_KEYS, PERMISSIONS, PATROL_API_STATES } from '../constants';

import EditableItem from '../EditableItem';
import DasIcon from '../DasIcon';
import ReportedBySelect from '../ReportedBySelect';
import AddReport from '../AddReport';
import ReportListItem from '../ReportListItem';

import NoteModal from '../NoteModal';
import ImageModal from '../ImageModal';

import HeaderMenuContent from './HeaderMenuContent';
import StatusBadge from './StatusBadge';
import PatrolDateInput from './DateInput';

import PatrolDistanceCovered from '../Patrols/DistanceCovered';

import TimeRangeAlert from './TimeRangeAlert';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';
import { openModalForReport } from '../utils/events';

const STARTED_LABEL = 'Started';
const SCHEDULED_LABEL = 'Scheduled';
const AUTO_START_LABEL = 'Auto Start';
const AUTO_END_LABEL = 'Auto End';

const { Modal, Header, Body, Footer, AttachmentControls, AttachmentList, LocationSelectorInput } = EditableItem;
const PatrolModal = (props) => {
  const { addModal, patrol, map, id, removeModal, updateUserPreferences, autoStartPatrols, autoEndPatrols, eventStore,fetchTrackedBySchema, patrolLeaderSchema} = props;
  const [statePatrol, setStatePatrol] = useState(patrol);
  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [addedReports, setAddedReports] = useState([]);
  const [isSaving, setSaveState] = useState(false);

  const filesToList = useMemo(() => [...statePatrol.files, ...filesToUpload], [filesToUpload, statePatrol.files]);

  const displayStartTime = useMemo(() => displayStartTimeForPatrol(statePatrol), [statePatrol]);
  const displayEndTime = useMemo(() => displayEndTimeForPatrol(statePatrol), [statePatrol]);
  const actualStartTime = useMemo(() => actualStartTimeForPatrol(statePatrol), [statePatrol]);
  const actualEndTime = useMemo(() => actualEndTimeForPatrol(statePatrol), [statePatrol]);
  const displayDuration = useMemo(() => displayDurationForPatrol(statePatrol), [statePatrol]);
  const canEditPatrol = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.UPDATE);

  const patrolIconId = useMemo(() => iconTypeForPatrol(patrol), [patrol]);

  const patrolSegmentId = useMemo(() => displayPatrolSegmentId(patrol), [patrol]);

  useEffect(() => {
    fetchTrackedBySchema()
      .catch((e) => {
        //
      });
  });

  const PatrolLeaders = patrolLeaderSchema.trackedbySchema ?
    patrolLeaderSchema.trackedbySchema.properties.leader.enum_ext.map(({ value }) => value): [];

  const patrolReports = useMemo(() => {
    const currReports = getReportsForPatrol(patrol);
    const syncedReports = currReports.map( (report) => {
      // if there is no entry for this event, add it to the store
      if (!eventStore[report.id]) {
        eventStore[report.id] = report;
        return report;
      } else return eventStore[report.id];
    });
    return syncedReports;
  }, [eventStore, patrol]);

  const allPatrolReports = useMemo(() => {
    // don't show the contained reports, which are also bound to the segment
    const allReports = [...addedReports, ...patrolReports];
    const incidents = allReports.filter(report => report.is_collection);
    const incidentIds = incidents.reduce((accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident)|| [])],[]);
    const topLevelReports = allReports.filter(report =>
      !incidentIds.includes(report.id));

    return orderBy(topLevelReports, [
      (item) => {
        return new Date(item.updated_at);
      }],['acs']);
  }, [addedReports, patrolReports]);

  const allPatrolReportIds = useMemo(() => {
    return (allPatrolReports || []).map(({ id }) => id);
  }, [allPatrolReports]);

  const displayTrackingSubject = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { leader } = firstLeg;
    if (!leader) return null;
    return leader;
  }, [statePatrol.patrol_segments]);

  const debouncedTrackFetch = useRef(null);

  useEffect(() => {
    if (displayTrackingSubject && displayTrackingSubject.id) {
      window.clearTimeout(debouncedTrackFetch.current);
      debouncedTrackFetch.current = setTimeout(() => {
        fetchTracksIfNecessary([displayTrackingSubject.id], {
          optionalDateBoundaries: { since: actualStartTime, until: actualEndTime },
        });
      }, 150);
      return () => window.clearTimeout(debouncedTrackFetch.current);
    }
  }, [actualEndTime, actualStartTime, displayTrackingSubject]);


  const displayTitle = useMemo(() => displayTitleForPatrol(statePatrol), [statePatrol]);

  const onTitleChange = useCallback((value) => {
    trackEvent('Patrol Modal', 'Set patrol title');

    setStatePatrol({
      ...statePatrol,
      title: value,
    });
  }, [statePatrol]);

  const onStartLocationChange = useCallback((value) => {
    trackEvent('Patrol Modal', 'Set patrol start location');

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          start_location: value ? {
            longitude: value[0],
            latitude: value[1],
          } : null,
        },
      ],
    });
  }, [statePatrol]);


  const onEndLocationChange = useCallback((value) => {
    trackEvent('Patrol Modal', 'Set patrol end location');

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...statePatrol.patrol_segments[0],
          end_location: value ? {
            longitude: value[0],
            latitude: value[1],
          } : null,
        },
      ],
    });
  }, [statePatrol]);

  const startTimeCommitButtonTitle = useCallback((_val, newVal) => {
    const startDate = new Date(newVal);

    if (Math.abs(
      differenceInMinutes(
        startDate, new Date()
      )
    ) < 2) {
      return 'Start Patrol';
    }
    if (isFuture(startDate)) return 'Schedule Patrol';
    if (isPast(startDate)) return 'Set Patrol Start';
  }, []);

  const endTimeCommitButtonTitle = useCallback((_val, newVal) => {
    const endDate = new Date(newVal);

    if (Math.abs(
      differenceInMinutes(
        endDate, new Date()
      )
    ) < 2) {
      return 'End Patrol';
    }
    if (isFuture(endDate)) return 'Schedule End';
    if (isPast(endDate)) return 'Set Patrol End';
  }, []);

  const setAutoStart = useCallback((val) => {
    updateUserPreferences({ autoStartPatrols: val });
  }, [updateUserPreferences]);

  const setAutoEnd = useCallback((val) => {
    updateUserPreferences({ autoEndPatrols: val });
  }, [updateUserPreferences]);

  const onStartTimeChange = useCallback((value, isAuto) => {
    trackEvent('Patrol Modal', 'Set patrol start time');

    const [segment] = statePatrol.patrol_segments;
    const updatedValue = new Date(value).toISOString();

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...segment,
          scheduled_start: isAuto ? null : updatedValue,
          time_range: {
            ...segment.time_range,
            start_time: isAuto ? updatedValue : null,
          },
        },
      ],
    });
  }, [statePatrol]);

  const onEndTimeChange = useCallback((value, isAuto) => {
    trackEvent('Patrol Modal', 'Set patrol end time');

    const [segment] = statePatrol.patrol_segments;

    const update = new Date(value).toISOString();

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...segment,
          scheduled_end: value ?
            (isAuto ? null : update)
            : null,
          time_range: {
            ...segment.time_range,
            end_time: value ?
              (isAuto ? update : null)
              : null,
          },
        },
      ],
    });
  }, [statePatrol]);

  const onSelectTrackedSubject = useCallback((value) => {
    const patrolIsNew = !statePatrol.id;

    trackEvent('Patrol Modal', `${value ? 'Set' : 'Unset'} patrol tracked subject`);

    const update = {
      patrol_segments: [
        {
          leader: value || null,
        },
      ],
    };

    if (patrolIsNew) {
      const trackedSubjectLocation = value?.last_position?.geometry?.coordinates;
      const trackedSubjectLocationTime = value?.last_position?.properties?.coordinateProperties?.time;

      if (radioHasRecentActivity(value)
        && subjectIsARadio(value)
        && !!trackedSubjectLocation
        && !!trackedSubjectLocationTime) {

        update.patrol_segments[0].start_location = {
          latitude: trackedSubjectLocation[1],
          longitude: trackedSubjectLocation[0],
        };

        update.patrol_segments[0].time_range = {
          start_time: trackedSubjectLocationTime,
        };
      } else if (!value) {

        update.patrol_segments[0].start_location = null;
        update.patrol_segments[0].time_range = {
          start_time: new Date().toISOString(),
        };
      }
    }

    setStatePatrol(merge({}, statePatrol, update));
  }, [statePatrol]);

  const onPrioritySelect = useCallback((priority) => {
    const valueTitle = REPORT_PRIORITIES.find(item => item.value === priority).display;

    trackEvent('Patrol Modal', 'Set patrol priority', valueTitle);

    setStatePatrol({
      ...statePatrol,
      priority,
    });
  }, [statePatrol]);

  const onAddFiles = useCallback((files) => {
    trackEvent('Patrol Modal', 'Add attachment to patrol');

    const uploadableFiles = filterDuplicateUploadFilenames([...filesToList], files);

    updateFilesToUpload([...filesToUpload, ...uploadableFiles]);
  }, [filesToList, filesToUpload]);

  const onAddReport = useCallback((reportData) => {
    trackEvent('Patrol Modal', 'Save report to patrol');
    // report form has different payloads resp for incidents and reports
    const report = reportData.length ? reportData[0] : reportData;
    const { data: { data } } = report;

    // patch the report to include the segment id
    addPatrolSegmentToEvent(patrolSegmentId, data.id,);

    // dedupe collections
    if(!allPatrolReportIds.includes(data.id)) {
      setAddedReports([...addedReports, data]);
    }
  }, [addedReports, allPatrolReportIds, patrolSegmentId]);

  const onSaveNote = useCallback((noteToSave) => {

    const note = { ...noteToSave };
    const noteIsNew = !note.id;

    trackEvent('Patrol Modal', `${noteIsNew ? 'Add' : 'update'} note for patrol`);

    if (noteIsNew) {
      const { originalText } = note;

      if (originalText) {
        const { notes } = statePatrol;
        setStatePatrol({
          ...statePatrol,
          notes: notes.map(n => n.text === originalText ? note : n),
        });

      } else {
        setStatePatrol({
          ...statePatrol,
          notes: [
            ...statePatrol.notes,
            note
          ]
        });
      }
      delete note.originalText;
    } else {
      setStatePatrol({
        ...statePatrol,
        notes: statePatrol.notes.map(n => n.id === note.id ? note : n),
      });
    }
  }, [statePatrol]);

  const onDeleteNote = useCallback((note) => {
    trackEvent('Patrol Modal', 'Delete note from patrol');

    const { text } = note;

    const { notes } = statePatrol;

    setStatePatrol({
      ...statePatrol,
      notes: notes.filter(n => n.text !== text),
    });
  }, [statePatrol]);

  const onDeleteFile = useCallback((file) => {
    trackEvent('Patrol Modal', 'Delete file from patrol');

    const { name } = file;
    updateFilesToUpload(filesToUpload.filter(({ name: n }) => n !== name));
  }, [filesToUpload]);

  const onClickFile = useCallback(async (file) => {
    trackEvent('Patrol Modal', 'Click attachment in list of attachments');

    if (file.file_type === 'image') {
      const fileData = await fetchImageAsBase64FromUrl(file.images.original);

      addModal({
        content: ImageModal,
        src: fileData,
        title: file.filename,
      });
    } else {
      await downloadFileFromUrl(file.url, { filename: file.filename });
    }
  }, [addModal]);

  const startEditNote = useCallback((note) => {
    addModal({
      content: NoteModal,
      note,
      onSubmit: onSaveNote,
    });
  }, [addModal, onSaveNote]);

  const patrolStartLocation = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;

    const [firstLeg] = statePatrol.patrol_segments;

    if (!firstLeg.start_location) return null;
    return [firstLeg.start_location.longitude, firstLeg.start_location.latitude];
  }, [statePatrol.patrol_segments]);

  const patrolEndLocation = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;

    const [firstLeg] = statePatrol.patrol_segments;

    if (!firstLeg.end_location) return null;
    return [firstLeg.end_location.longitude, firstLeg.end_location.latitude];
  }, [statePatrol.patrol_segments]);

  const displayPriority = useMemo(() => {
    if (statePatrol.hasOwnProperty('priority')) return statePatrol.priority;
    if (!!statePatrol.patrol_segments.length) return statePatrol.patrol_segments[0].priority;
    return null;
  }, [statePatrol]);

  const displayAutoStart = useMemo(() => {
    const { time_range: { start_time }} = statePatrol.patrol_segments[0];
    return(!!start_time);
  }, [statePatrol]);

  const displayAutoEnd = useMemo(() => {
    const { time_range: { end_time }}  = statePatrol.patrol_segments[0];
    return(!!end_time);
  }, [statePatrol]);

  const allPatrolUpdateHistory = useMemo(() => {
    // when patrol is not saved yet
    if (!statePatrol.updates) return [];
    const topLevelUpdate = statePatrol.updates;
    const [firstLeg] = statePatrol.patrol_segments;
    const { updates: segmentUpdates } = firstLeg;
    const noteUpdates = extractAttachmentUpdates(statePatrol.notes);
    const fileUpdates = extractAttachmentUpdates(statePatrol.files);
    const eventUpdates = extractAttachmentUpdates(firstLeg.events);
    const allUpdates = [...topLevelUpdate, ...segmentUpdates, ...noteUpdates, ...fileUpdates, ...eventUpdates];

    return orderBy(allUpdates, [
      (item) => {
        return new Date(item.time);
      }],['desc']);
  }, [statePatrol]);

  const patrolWithFlattenedHistory = useMemo(() => {
    return({...statePatrol, updates: allPatrolUpdateHistory});
  }, [statePatrol, allPatrolUpdateHistory]);

  const onSave = useCallback(() => {

    if (!patrolTimeRangeIsValid(statePatrol)) {
      addModal({content: TimeRangeAlert});
      return;
    }

    setSaveState(true);
    trackEvent('Patrol Modal', `Click "save" button for ${!!statePatrol.id ? 'existing' : 'new'} patrol`);

    let toSubmit = {...statePatrol};

    if(patrolShouldBeMarkedDone(statePatrol)){
      toSubmit.state=PATROL_API_STATES.DONE;
    } else if (patrolShouldBeMarkedOpen(statePatrol)) {
      toSubmit.state=PATROL_API_STATES.OPEN;
    }

    const LOCATION_PROPS =  ['start_location', 'end_location'];

    LOCATION_PROPS.forEach((prop) => {
      if (toSubmit.hasOwnProperty(prop) && !toSubmit[prop]) {
        toSubmit[prop] = null;
      }
    });

    // just assign added reports to inital segment id for now
    addedReports.forEach((report) => {
      addPatrolSegmentToEvent(patrolSegmentId, report.id);
    });

    const actions = generateSaveActionsForReportLikeObject(toSubmit, 'patrol', [], filesToUpload);

    return executeSaveActions(actions)
      .then((results) => {
        trackEvent('Patrol Modal', `Saved ${!!statePatrol.id ? 'existing' : 'new'} patrol`);
        removeModal(id);

        return results;
      })
      .catch((error) => {
        trackEvent('Patrol Modal', `Error saving ${!!statePatrol.id ? 'existing' : 'new'} patrol`);
        console.warn('failed to save new patrol', error);
      })
      .finally(() => {
        setSaveState(false);
      });
  }, [addModal, filesToUpload, id, removeModal, statePatrol, addedReports, patrolSegmentId]);

  const startTimeLabel = useMemo(() => {
    const [firstLeg] = statePatrol.patrol_segments;

    if (isSegmentActive(firstLeg)) return STARTED_LABEL;

    const patrolState = calcPatrolCardState(statePatrol);

    if (patrolState === PATROL_CARD_STATES.READY_TO_START
    || patrolState === PATROL_CARD_STATES.SCHEDULED
    || patrolState === PATROL_CARD_STATES.START_OVERDUE) {
      return (displayAutoStart ? AUTO_START_LABEL : SCHEDULED_LABEL);
    }

    return null;
  }, [displayAutoStart, statePatrol]);

  const endTimeLabel = useMemo(() => {
    const [firstLeg] = statePatrol.patrol_segments;

    const endScheduled = isSegmentEndScheduled(firstLeg);

    if (displayAutoEnd) {
      return AUTO_END_LABEL;
    }

    if (endScheduled) {
      return SCHEDULED_LABEL;
    }

    return null;
  }, [displayAutoEnd, statePatrol.patrol_segments]);

  const startTimeLabelClass = useMemo(() => {
    if (startTimeLabel === STARTED_LABEL) return styles.startedLabel;
    if (startTimeLabel === SCHEDULED_LABEL || startTimeLabel === AUTO_START_LABEL) return styles.scheduledLabel;
    return null;
  }, [startTimeLabel]);

  const onCancel = useCallback(() => {
    trackEvent('Patrol Modal', 'Click "cancel" button');

    removeModal(id);
  }, [id, removeModal]);

  const onReportListItemClick = useCallback((item) => {
    trackEvent('Patrol Modal', `Click ${item.is_collection ? 'incident' : 'report'} list item in patrol modal`);
    openModalForReport(item, map, {isPatrolReport: true, onSaveSuccess: onAddReport} );
  }, [map, onAddReport]);

  const saveButtonDisabled = useMemo(() => !canEditPatrol || isSaving, [canEditPatrol, isSaving]);

  return <EditableItem data={patrolWithFlattenedHistory}>
    <Modal>
      {isSaving && <LoadingOverlay className={styles.savingOverlay} message='Saving Patrol...' />}
      <Header
        analyticsMetadata={{
          category: 'Patrol Modal',
          location: 'patrol modal',
        }}
        icon={<DasIcon type='events' iconId={patrolIconId} />}
        title={displayTitle}
        menuContent={<HeaderMenuContent onPrioritySelect={onPrioritySelect} />}
        priority={displayPriority}
        onTitleChange={onTitleChange}
      >
        <StatusBadge />
      </Header>
      <div className={styles.topControls}>
        <label>
          Tracking:
          <ReportedBySelect className={styles.reportedBySelect} placeholder='Tracked By...' value={displayTrackingSubject} onChange={onSelectTrackedSubject} options={PatrolLeaders} />
        </label>
      </div>
      <section className={`${styles.timeBar} ${styles.start}`}>
        <div>
          <h6>Start</h6>
          <PatrolDateInput
            value={displayStartTime}
            calcSubmitButtonTitle={startTimeCommitButtonTitle}
            onChange={onStartTimeChange}
            maxDate={displayEndTime || null}
            showClockIcon={true}
            isAuto={autoStartPatrols}
            placement='bottom'
            placeholder='Set Start Time'
            autoCheckLabel='Auto-start patrol'
            onAutoCheckToggle={setAutoStart}
            required={true}
          />
          {startTimeLabel && <span className={startTimeLabelClass}>
            {startTimeLabel}
          </span>}
        </div>
        <LocationSelectorInput label='' iconPlacement='input' map={map} location={patrolStartLocation} onLocationChange={onStartLocationChange} placeholder='Set Start Location' />
      </section>
      <Body className={styles.body}>
        <ul className={styles.segmentList}>
          <li className={styles.segment}>
            <ul>
              {allPatrolReports.map((item, index) =>
                <ReportListItem
                  className={styles.listItem}
                  map={map}
                  report={item}
                  key={`${item.id}-${index}`}
                  onTitleClick={onReportListItemClick} />
              )}
            </ul>
          </li>
        </ul>
        <AttachmentList
          className={styles.attachments}
          files={filesToList}
          notes={statePatrol.notes}
          onClickFile={onClickFile}
          onClickNote={startEditNote}
          onDeleteNote={onDeleteNote}
          onDeleteFile={onDeleteFile} />
      </Body>
      <section className={`${styles.timeBar} ${styles.end}`}>
        <div>
          <h6>End</h6>
          <PatrolDateInput
            value={displayEndTime}
            defaultValue={new Date()}
            calcSubmitButtonTitle={endTimeCommitButtonTitle}
            onChange={onEndTimeChange}
            maxDate={null}
            showClockIcon={true}
            isAuto={autoEndPatrols}
            placement='top'
            placeholder='Set End Time'
            startTime={displayStartTime}
            onAutoCheckToggle={setAutoEnd}
            autoCheckLabel='Auto-end patrol'
            required={true}
          />
          {endTimeLabel && <span className={styles.scheduledLabel}>
            {endTimeLabel}
          </span>}
        </div>
        <span className={displayDuration !== '0s' ? '' : styles.faded}>
          <strong>Duration:</strong> <span className={styles.patrolDetail}>{displayDuration}</span>
        </span>
        <span>
          <strong>Distance:</strong> <span className={styles.patrolDetail}><ConnectedDistanceCovered patrol={statePatrol} /></span>
        </span>
        <LocationSelectorInput label='' iconPlacement='input' map={map} location={patrolEndLocation} onLocationChange={onEndLocationChange} placeholder='Set End Location' />
      </section>
      <AttachmentControls
        analyticsMetadata={{
          category: 'Patrol Modal',
          location: 'patrol modal',
        }}
        onAddFiles={onAddFiles}
        onSaveNote={onSaveNote}>
        {patrolSegmentId &&<AddReport map={map}
          analyticsMetadata={{
            category: 'Patrol Modal',
            location: 'patrol modal',
          }}
          formProps={{
            hidePatrols: true,
            onSaveSuccess: onAddReport,
            isPatrolReport: true,
          }}
        />}
      </AttachmentControls>
      <Footer
        cancelTitle={canEditPatrol ? undefined : 'Close'}
        saveDisabled={saveButtonDisabled}
        onCancel={onCancel}
        onSave={onSave}
        isActiveState={true}
      />
    </Modal>
  </EditableItem>;

};

const mapStateToProps = ({ view: { userPreferences:  { autoStartPatrols, autoEndPatrols } }, data: { eventStore }, data: {patrolLeaderSchema} }) => ({
  autoStartPatrols,
  autoEndPatrols,
  eventStore,
  patrolLeaderSchema
});

const makeMapStateToProps = () => {
  const getDataForPatrolFromProps = createPatrolDataSelector();
  const mapStateToProps = (state, props) => {
    return {
      patrolData: getDataForPatrolFromProps(state, props),
    };
  };
  return mapStateToProps;
};

const ConnectedDistanceCovered = connect(makeMapStateToProps, null)(memo((props) => <PatrolDistanceCovered patrolsData={[props.patrolData]} />)); /* eslint-disable-line react/display-name */

export default connect(mapStateToProps, { addModal, removeModal, updateUserPreferences, setModalVisibilityState, fetchTrackedBySchema })(memo(PatrolModal));

PatrolModal.propTypes = {
  patrol: PropTypes.object.isRequired,
};
