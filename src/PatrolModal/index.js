import React, { memo, useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { removeModal, setModalVisibilityState } from '../ducks/modals';

import EditableItem from '../EditableItem';
import DasIcon from '../DasIcon';
import ReportedBySelect from '../ReportedBySelect';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const { Modal, Header, Body, Footer, AttachmentControls, AttachmentList, LocationSelectorInput } = EditableItem;

const PatrolModal = (props) => {
  const { patrol, map } = props;
  const [statePatrol, setStatePatrol] = useState(patrol);

  const handleTitleChange = useCallback((value) => {
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

  const onSelectTrackedSubject = useCallback((value) => {
    console.log('what does the API expect for the value of the tracked subject?', value);
  }, []);

  const patrolStartLocation = useMemo(() => {
    if (!statePatrol.patrol_segments.length) return null;

    const [firstLeg] = statePatrol.patrol_segments;

    if (!firstLeg.start_location) return null;
    return [firstLeg.start_location.lng, firstLeg.start_location.lat];
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
        onTitleChange={handleTitleChange}
      />
      <div className={styles.topControls}>
        <label>
          Tracking:
          <ReportedBySelect className={styles.reportedBySelect} value={null} onChange={onSelectTrackedSubject} />
        </label>
      </div>
      <Body>
        <div className={`${styles.timeBar} ${styles.start}`}>
          <p>I am a time selector</p>
          <LocationSelectorInput label='Start Location:' map={map} location={patrolStartLocation} onLocationChange={onStartLocationChange} />
        </div>
        <ul className={styles.segmentList}>
          <li className={styles.segment}>
            This is where a report segment, currently represented in the UI as a list of contained reports, would live.
            <ul>
              <li>Report 1 huh</li>
              <li>Report 2 huh</li>
              <li>Report 3 huh</li>
            </ul>
          </li>
        </ul>
        <div className={`${styles.timeBar} ${styles.end}`}>
        This is where you place the time and location of the patrol ending. Here&#39;s a list of what that contains.
          <ul>
            <li>Time selector</li>
            <li> Duration </li>
            <li> Distance </li>
            <li> Location selector </li>
          </ul> 
        </div>
        <AttachmentList
          files={statePatrol.files}
          notes={statePatrol.notes}
          onClickFile={() => console.log('file click')}
          onClickNote={() => console.log('note click')}
          onDeleteNote={() => console.log('note delete')}
          onDeleteFile={() => console.log('file delete')} />
      </Body>
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