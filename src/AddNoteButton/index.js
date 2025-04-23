import React, { useCallback, useContext, memo } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../utils/analytics';

import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';

const AddNoteButton = ({ className = '', onAddNote, ...rest }) => {
  const analytics = useContext(TrackerContext);
  const { t } = useTranslation('details-view');

  const onClick = useCallback((...args) => {
    analytics?.track('Start "Add Note"');
    onAddNote(...args);
  }, [analytics, onAddNote]);

  return <Button
      data-testid="addNoteButton"
      className={className}
      onClick={onClick}
      type="button"
      variant="secondary"
      {...rest}
    >
    <NoteIcon />
    <label>{t('addNoteButton')}</label>
  </Button>;
};

export default memo(AddNoteButton);
