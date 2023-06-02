import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const InvalidDatesModal = ({ onHide, show }) => {
  const onClickOk = useCallback(() => onHide(), [onHide]);

  return <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>Invalid Patrol Times</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <p>
        This patrol can not be saved. The end time of a patrol must be later than the start time. Please correct the
        start or end patrol time.
      </p>
    </Modal.Body>

    <Modal.Footer>
      <Button onClick={onClickOk} tabIndex={2} type="button" variant="primary">OK</Button>
    </Modal.Footer>
  </Modal>;
};

InvalidDatesModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(InvalidDatesModal);
