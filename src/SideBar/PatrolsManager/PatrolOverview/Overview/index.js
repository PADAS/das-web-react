import React, { memo } from 'react';

import Activity from './Activity';
import Legs from './Legs';

const Overview = ({
  newAttachments,
  newNotes,
  onCancelNote,
  onChangeNote,
  onDeleteAttachment,
  onDeleteNote,
  onDoneNote,
  patrol,
}) => <>
  <Legs patrol={patrol} />

  <Activity
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
