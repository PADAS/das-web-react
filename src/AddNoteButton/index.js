import React, { useCallback, useContext, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../utils/analytics';

import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';

import * as styles from './styles.module.scss';

const AddNoteButton = ({ onAddNote, ...rest }) => {
  const analytics = useContext(TrackerContext);
  const { t } = useTranslation('details-view');

  const onClick = useCallback(() => {
    analytics?.track('Start "Add Note"');
    onAddNote();
  }, [analytics, onAddNote]);

  return <button
      aria-label={t('addNoteButtonLabel')}
      data-testid="addNoteButton"
      className={styles.addNoteButton}
      onClick={onClick}
      title={t('addNoteButtonLabel')}
      type="button"
      {...rest}
    >
    <NoteIcon aria-hidden="true" />

    <span>{t('addNoteButton')}</span>
  </button>;
};

export default memo(AddNoteButton);
