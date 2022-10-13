import React, { memo } from 'react';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const InformationModal = ({ onHide, show }) => <Modal onHide={onHide} show={show}>
  <Modal.Header closeButton>
    <Modal.Title>Creating A Report Area</Modal.Title>
  </Modal.Header>

  <Modal.Body className={styles.body}>
    <h3>Report Area</h3>
    <p>A single closed shape with 3 or more points and no intersecting lines. Area and distance measurements are approximate, they do not factor in changes in terrain and elevation.</p>

    <h3>Adding points</h3>
    <p>Click anywhere on the map to add the points of a report area.</p>

    <h3>Closing the area</h3>
    <p>Click the first point or press ‘enter’ on your keyboard to close the shape.</p>

    <h3>Deleting points</h3>
    <p>Click the point you want to delete and press ‘delete’ or ‘backspace’ key on your keyboard.</p>

    <h3>Adding points to an existing area</h3>
    <p>Hover over a segment of the report area then click and drag the new point to the desired location.</p>
  </Modal.Body>
</Modal>;

InformationModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default memo(InformationModal);
