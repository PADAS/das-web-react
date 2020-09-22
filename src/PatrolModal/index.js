import React, { memo, useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import { getFeedEvents } from '../selectors';
import { addModal, removeModal, setModalVisibilityState } from '../ducks/modals';
import { filterDuplicateUploadFilenames, fetchImageAsBase64FromUrl } from '../utils/file';
import { downloadFileFromUrl } from '../utils/download';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { displayTitleForPatrol, displayStartTimeForPatrol, displayEndTimeForPatrol, displayDurationForPatrol } from '../utils/patrols';

import EditableItem from '../EditableItem';
import DasIcon from '../DasIcon';
import ReportedBySelect from '../ReportedBySelect';
import DateTimePickerPopover from '../DateTimePickerPopover';
import ReportListItem from '../ReportListItem';
import AddReport from '../AddReport';

import NoteModal from '../NoteModal';
import ImageModal from '../ImageModal';

import HeaderMenuContent from './HeaderMenuContent';
import StatusBadge from './StatusBadge';

// import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { Modal, Header, Body, Footer, AttachmentControls, AttachmentList, LocationSelectorInput } = EditableItem;

const PatrolModal = (props) => {
  const { addModal, events, patrol, map, id, removeModal } = props;
  console.log('my map', map);
  const [statePatrol, setStatePatrol] = useState(patrol);
  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [notesToAdd, updateNotesToAdd] = useState([]);

  const eventsToShow = useMemo(() => {
    const cloned = [...events.results];
    cloned.length = Math.min(cloned.length, 5);
    return cloned;
  }, [events]);

  const filesToList = useMemo(() => [...statePatrol.files, ...filesToUpload], [filesToUpload, statePatrol.files]);
  const notesToList = useMemo(() => [...statePatrol.notes, ...notesToAdd], [notesToAdd, statePatrol.notes]);

  const displayStartTime = displayStartTimeForPatrol(statePatrol);
  const displayEndTime = displayEndTimeForPatrol(statePatrol);
  const displayDuration = displayDurationForPatrol(statePatrol);

  const displayTitle = useMemo(() => displayTitleForPatrol(statePatrol), [statePatrol]);

  const displayTrackingSubject = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;
    const [firstLeg] = statePatrol.patrol_segments;

    const { leader } = firstLeg;
    if (!leader) return null;
    return leader;
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
            longitude: value[0],
            latitude: value[1],
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
            longitude: value[0],
            latitude: value[1],
          } : null,
        },
      ],
    });
  }, [statePatrol]);

  const onStartTimeChange = useCallback((value) => {
    const [segment] = statePatrol.patrol_segments;
    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...segment,
          time_range: {
            ...segment.time_range,
            start_time: value ? new Date(value).toISOString() : null,
          },
        },
      ],
    });
  }, [statePatrol]);

  const onEndTimeChange = useCallback((value) => {
    const [segment] = statePatrol.patrol_segments;

    setStatePatrol({
      ...statePatrol,
      patrol_segments: [
        {
          ...segment,
          time_range: {
            ...segment.time_range,
            end_time: value ? new Date(value).toISOString() : null,
          },
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
          leader: value ? value : null,
          start_location: !!trackedSubjectLocation ? {
            latitude: trackedSubjectLocation[1],
            longitude: trackedSubjectLocation[0],
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

  const onAddFiles = useCallback((files) => {
    const uploadableFiles = filterDuplicateUploadFilenames([...filesToList], files);
    
    updateFilesToUpload([...filesToUpload, ...uploadableFiles]);
  }, [filesToList, filesToUpload]);
  

  const onSaveNote = useCallback((noteToSave) => {
    const note = { ...noteToSave };
    const noteIsNew = !note.id;

    if (noteIsNew) {
      const { originalText } = note;

      if (originalText) {
        updateNotesToAdd(
          notesToAdd.map(n => n.text === originalText ? note : n)
        );
      } else {
        updateNotesToAdd([...notesToAdd, note]);
      }
      delete note.originalText;
    } else {
      setStatePatrol({
        ...statePatrol,
        notes: statePatrol.notes.map(n => n.id === note.id ? note : n),
      });
    }
  }, [notesToAdd, statePatrol]);

  const onDeleteNote = useCallback((note) => {
    const { text } = note;
    updateNotesToAdd(notesToAdd.filter(({ text: t }) => t !== text));
  }, [notesToAdd]);

  const onDeleteFile = useCallback((file) => {
    const { name } = file;
    updateFilesToUpload(filesToUpload.filter(({ name: n }) => n !== name));
  }, [filesToUpload]);

  const onClickFile = useCallback(async (file) => {
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
    if (statePatrol.priority) return statePatrol.priority;
    if (!!statePatrol.patrol_segments.length) return statePatrol.patrol_segments[0].priority;
    return null;
  }, [statePatrol.patrol_segments, statePatrol.priority]);

  const onSave = useCallback(() => {
    // const reportIsNew = !statePatrol.id;
    let toSubmit = statePatrol;

    const LOCATION_PROPS =  ['start_location', 'end_location'];

    LOCATION_PROPS.forEach((prop) => {
      if (toSubmit.hasOwnProperty(prop) && !toSubmit[prop]) {
        toSubmit[prop] = null;
      }
    });

    const actions = generateSaveActionsForReportLikeObject(toSubmit, 'patrol', notesToAdd, filesToUpload);

    return executeSaveActions(actions)
      .then((results) => {
        removeModal(id);
        // onSaveSuccess(results);
        /*   if (report.is_collection && toSubmit.state) {
          return Promise.all(report.contains
            .map(contained => contained.related_event.id)
            .map(id => setEventState(id, toSubmit.state)));
        } */
        return results;
      })
      .catch((error) => {
        console.warn('failed to save new patrol', error);
      });
  }, [filesToUpload, id, notesToAdd, removeModal, statePatrol]);

  return <EditableItem data={statePatrol}>
    <Modal>
      <Header 
        icon={<DasIcon type='events' iconId='fence-patrol-icon' />}
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
          files={filesToList}
          notes={notesToList}
          onClickFile={onClickFile}
          onClickNote={startEditNote}
          onDeleteNote={onDeleteNote}
          onDeleteFile={onDeleteFile} />
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
        onAddFiles={onAddFiles}
        onSaveNote={onSaveNote}>
        <AddReport map={map} hidePatrols={true} onSaveSuccess={(...args) => console.log('report saved', args)} />
      </AttachmentControls>
      <Footer
        onCancel={() => console.log('cancel')}
        onSave={onSave}
        onStateToggle={() => console.log('state toggle')}
        isActiveState={true}
      />
    </Modal>
  </EditableItem>;

};

const mapStateToProps = (state) => ({
  events: getFeedEvents(state),
});
export default connect(mapStateToProps, { addModal, removeModal, setModalVisibilityState })(memo(PatrolModal));

PatrolModal.propTypes = {
  patrol: PropTypes.object.isRequired,
};