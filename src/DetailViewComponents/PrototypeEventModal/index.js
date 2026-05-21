import React, { memo, useEffect, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import * as styles from './styles.module.scss';

const PrototypeEventModal = ({ show, eventType, onCancel, onDone }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (show) {
      setTitle(eventType?.display || '');
      setNotes('');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [show, eventType]);

  const save = () => {
    onDone({ title: title.trim() || eventType?.display || 'Event', notes: notes.trim() });
  };

  return <Modal show={show} onHide={onCancel} centered dialogClassName={styles.dialog}>
    <Modal.Body className={styles.body}>
      <div className={styles.eyebrow}>{eventType?.category?.display || 'Report'}</div>
      <h2 className={styles.title}>{eventType?.display || 'New Event'}</h2>

      <label className={styles.field}>
        <span className={styles.label}>Title</span>
        <input
          ref={titleRef}
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Notes</span>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add details about this event…"
        />
      </label>
    </Modal.Body>

    <Modal.Footer className={styles.footer}>
      <button type="button" className={styles.cancel} onClick={onCancel}>Cancel</button>
      <button type="button" className={styles.save} onClick={save}>Save Event</button>
    </Modal.Footer>
  </Modal>;
};

export default memo(PrototypeEventModal);
