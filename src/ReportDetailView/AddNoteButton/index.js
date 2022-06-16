import React, { memo } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as NoteIcon } from '../../common/images/icons/note.svg';

const AddNoteButton = ({ className, onAddNote }) => <Button
  data-testid="reportDetailView-addNoteButton"
  className={className}
  onClick={onAddNote}
  type="button"
  variant="secondary"
  >
  <NoteIcon />
  <label>Note</label>
</Button>;

AddNoteButton.defaultProps = {
  className: '',
};

AddNoteButton.propTypes = {
  className: PropTypes.string,
  onAddNote: PropTypes.func.isRequired,
};

export default memo(AddNoteButton);
