import React, { memo } from 'react';

import Activity from './Activity';
import Legs from './Legs';

const Overview = ({
  existingNotes,
  newAttachments,
  newNotes,
  onCancelNote,
  onChangeNote,
  onDeleteAttachment,
  onDeleteNote,
  onDoneNote,
  patrol,
  patrolState,
}) => <>
  <Legs patrol={patrol} patrolState={patrolState} />

  <Activity
    existingNotes={existingNotes}
    newAttachments={newAttachments}
    newNotes={newNotes}
    onCancelNote={onCancelNote}
    onChangeNote={onChangeNote}
    onDeleteAttachment={onDeleteAttachment}
    onDeleteNote={onDeleteNote}
    onDoneNote={onDoneNote}
    patrol={patrol}
  />
</>;

export default memo(Overview);
