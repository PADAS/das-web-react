import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as NoteIcon } from '../../common/images/icons/note.svg';

const AddNoteButton = ({ className, notesToAdd, reportTracker, setNotesToAdd }) => {
  const onClick = useCallback(() => {
    const userHasNewNoteEmpty = notesToAdd.some((noteToAdd) => !noteToAdd.text);
    if (userHasNewNoteEmpty) {
      window.alert('Can not add a new note: there\'s an empty note not saved yet');
    } else {
      const newNote = { creationDate: new Date().toISOString(), text: '' };
      setNotesToAdd([...notesToAdd, newNote]);

      reportTracker.track('Added Note');
    }
  }, [notesToAdd, reportTracker, setNotesToAdd]);

  return <Button className={className} onClick={onClick} type="button" variant="secondary">
    <NoteIcon />
    <label>Note</label>
  </Button>;
};

AddNoteButton.defaultProps = {
  className: '',
};

AddNoteButton.propTypes = {
  className: PropTypes.string,
  notesToAdd: PropTypes.arrayOf(PropTypes.object).isRequired,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }).isRequired,
  setNotesToAdd: PropTypes.func.isRequired,
};

export default memo(AddNoteButton);
