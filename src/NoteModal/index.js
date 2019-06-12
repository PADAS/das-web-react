import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';

import { removeModal } from '../ducks/modals';


const { Header, Title, Body, Footer } = Modal;

const NoteModal = memo((props) => {
  const { note, id, removeModal } = props;
  return <Fragment>
    <Header>
      <Title>{note.id ? 'Edit Note' : 'Add Note'}</Title>
    </Header>
    <Body>
      <textarea>
        
      </textarea>
    
    </Body>
    <Footer>
      <Button>Cancel</Button>
      <Button>Save</Button>
    </Footer>
  </Fragment>
});

export default connect(null, { removeModal })(NoteModal);