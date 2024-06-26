import React, { useCallback, useContext, memo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../utils/analytics';

import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';

const AddNoteButton = ({ className, onAddNote, ...rest }) => {
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

AddNoteButton.defaultProps = {
  className: '',
};

AddNoteButton.propTypes = {
  className: PropTypes.string,
  onAddNote: PropTypes.func.isRequired,
};

export default memo(AddNoteButton);
