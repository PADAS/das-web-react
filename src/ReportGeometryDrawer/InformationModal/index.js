import React, { memo } from 'react';
import Modal from 'react-bootstrap/Modal';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const InformationModal = () => <>
  <Header closeButton>
    <Title>Creating A Report Area</Title>
  </Header>

  <Body className={styles.body}>
    <h3>Adding points</h3>
    <p>Click anywhere on the map to add the points of a report area.</p>

    <h3>Closing the area</h3>
    <p>Click the first point or press ‘enter’ on your keyboard to close the shape.</p>

    <h3>Deleting points</h3>
    <p>Click the point you want to delete and press ‘delete’ on your keyboard.</p>

    <h3>Adding points to an area</h3>
    <p>Hover over a segment of the report area then click and drag the new point to the desired location.</p>
  </Body>
</>;

export default memo(InformationModal);
