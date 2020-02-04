import React, { memo, Fragment, useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { removeModal } from '../ducks/modals';

import { trackEvent } from '../utils/analytics';


const { Header, Title, Body, Footer } = Modal;

const NoteModal = (props) => {
  const { note, id, removeModal, onSubmit } = props;

  const inputRef = useRef(null);
  const noteIsNew = !note.id && !note.text;

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const [editedText, setEditedNoteText] = useState(note.text);

  const onCancel = () => {
    trackEvent('Report Note', 'Click \'Cancel\' Button');
    removeModal(id);
  };
  
  const onNoteFormSubmit = (e) => {
    e.preventDefault();
    trackEvent('Report Note', 'Click \'Save\' Button');
    onSubmit({
      ...note,
      text: editedText,
      originalText: note.text,
    });
    removeModal(id);
  };


  return <Fragment>
    <Header>
      <Title>{noteIsNew ? 'Add Note' : 'Edit Note'}</Title>
    </Header>
    <Form onSubmit={onNoteFormSubmit}>
      <Body>
        <textarea tabIndex={1} ref={inputRef} minLength={3} required style={{ width: '100%' }} value={editedText} onChange={({ target: { value } }) => setEditedNoteText(value)} />

      </Body>
      <Footer>
        <Button tabIndex={3} variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button tabIndex={2} type="submit" variant="primary">Save</Button>
      </Footer>
    </Form>
  </Fragment>;
};

export default connect(null, { removeModal })(memo(NoteModal));