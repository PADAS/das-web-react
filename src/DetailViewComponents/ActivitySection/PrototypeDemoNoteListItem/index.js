import React, { memo } from 'react';

import { ReactComponent as NoteIcon } from '../../../common/images/icons/note.svg';

import DateTime from '../../../DateTime';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const PrototypeDemoNoteListItem = ({ note }) => <li className={`${activitySectionStyles.itemRow} ${styles.itemRow}`}>
  <div className={`${activitySectionStyles.itemIcon} ${styles.itemIcon}`}>
    <NoteIcon />
  </div>

  <div className={activitySectionStyles.itemDetails}>
    <p className={`${activitySectionStyles.itemTitle} ${styles.itemTitle}`}>{note.text}</p>
    <DateTime className={activitySectionStyles.itemDate} date={note.time} showElapsed={false} />
  </div>

  <div className={activitySectionStyles.itemActionButtonContainer} />
  <div className={activitySectionStyles.itemActionButtonContainer} />
</li>;

export default memo(PrototypeDemoNoteListItem);
