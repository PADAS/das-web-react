import { useCallback, useMemo, useRef, useState } from 'react';

import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../../../utils/file';
import { uuid } from '../../../../utils/string';

import * as activitySectionStyles from '../../../../DetailViewComponents/ActivitySection/styles.module.scss';

const NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY = parseFloat(activitySectionStyles.cardToggleTransitionTime);

const usePatrolActivityEditing = (patrol, tracker) => {
  const newAttachmentRef = useRef(null);
  const newNoteRef = useRef(null);

  const [editedExistingNotes, setEditedExistingNotes] = useState({});
  const [newAttachments, setNewAttachments] = useState([]);
  const [newNotes, setNewNotes] = useState([]);

  const patrolAttachments = useMemo(() => Array.isArray(patrol.files) ? patrol.files : [], [patrol]);

  const patrolNotes = useMemo(() => Array.isArray(patrol.notes) ? patrol.notes : [], [patrol]);

  const editedNotes = useMemo(() => patrolNotes.map((note) => {
    const edition = editedExistingNotes[note.id];
    const editedText = edition?.text.trim();

    return {
      ...note,
      isUnsaved: !!editedText && editedText !== note.text.trim(),
      originalText: edition?.originalText ?? note.text,
      text: edition?.text ?? note.text,
    };
  }), [editedExistingNotes, patrolNotes]);

  const newNotesWithText = useMemo(() => newNotes.filter((note) => note.text.trim()), [newNotes]);

  const notesUpdate = useMemo(() => {
    const patrolNotesWithEditions = patrolNotes.map((note) => {
      const editedText = editedExistingNotes[note.id]?.text.trim();

      return editedText && editedText !== note.text.trim() ? { ...note, text: editedText } : note;
    });

    const hasEditedNotes = patrolNotesWithEditions.some((note, index) => note !== patrolNotes[index]);

    return hasEditedNotes || newNotesWithText.length > 0
      ? [...patrolNotesWithEditions, ...newNotesWithText.map(({ text }) => ({ text: text.trim() }))]
      : null;
  }, [editedExistingNotes, newNotesWithText, patrolNotes]);

  const onAddNote = useCallback(() => {
    setNewNotes((prevNewNotes) => [
      ...prevNewNotes,
      { creationDate: new Date().toISOString(), ref: newNoteRef, text: '', tmpId: uuid() },
    ]);

    setTimeout(
      () => newNoteRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
      NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY
    );

    tracker.track('Added Note');
  }, [tracker]);

  const onChangeNote = useCallback((originalNote, event) => {
    if (originalNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map(
        (note) => note.tmpId === originalNote.tmpId ? { ...note, text: event.target.value } : note
      ));
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => ({
        ...prevEditedExistingNotes,
        [originalNote.id]: { originalText: originalNote.originalText, text: event.target.value },
      }));
    }
  }, []);

  const onDoneNote = useCallback((editedNote) => {
    if (editedNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map((note) => {
        if (note.tmpId === editedNote.tmpId) {
          // The trimmed text becomes the original one, so the note no longer
          // counts as being written.
          const text = note.text.trim();
          return { ...note, originalText: text, text };
        }
        return note;
      }));

      tracker.track('Save new note');
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => {
        const text = editedNote.text.trim();

        return { ...prevEditedExistingNotes, [editedNote.id]: { originalText: text, text } };
      });

      tracker.track('Save existing note');
    }
  }, [tracker]);

  const onCancelNote = useCallback((editedNote) => {
    if (editedNote.tmpId) {
      setNewNotes((prevNewNotes) => prevNewNotes.map(
        (note) => note.tmpId === editedNote.tmpId ? { ...note, text: note.originalText } : note
      ));
    } else {
      setEditedExistingNotes((prevEditedExistingNotes) => {
        const edition = prevEditedExistingNotes[editedNote.id];

        if (!edition) {
          return prevEditedExistingNotes;
        }

        if (edition.originalText === patrolNotes.find((note) => note.id === editedNote.id)?.text) {
          const nextEditedExistingNotes = { ...prevEditedExistingNotes };
          delete nextEditedExistingNotes[editedNote.id];
          return nextEditedExistingNotes;
        }

        return { ...prevEditedExistingNotes, [editedNote.id]: { ...edition, text: edition.originalText } };
      });
    }
  }, [patrolNotes]);

  const onDeleteNote = useCallback((noteToDelete) => {
    setNewNotes((prevNewNotes) => prevNewNotes.filter((note) => note !== noteToDelete));

    tracker.track('Delete new note');
  }, [tracker]);

  const onAddAttachments = useCallback((files) => {
    const filesToAdd = filterDuplicateUploadFilenames(
      [...patrolAttachments, ...newAttachments.map((attachmentToAdd) => attachmentToAdd.file)],
      convertFileListToArray(files)
    );

    if (filesToAdd.length > 0) {
      setNewAttachments((prevNewAttachments) => [
        ...prevNewAttachments,
        ...filesToAdd.map((file) => ({ creationDate: new Date().toISOString(), file, ref: newAttachmentRef })),
      ]);

      setTimeout(
        () => newAttachmentRef.current?.scrollIntoView?.({ behavior: 'smooth' }),
        NEW_ACTIVITY_SECTION_ITEM_SCROLL_DELAY
      );

      tracker.track('Added Attachment');
    }
  }, [newAttachments, patrolAttachments, tracker]);

  const onDeleteAttachment = useCallback((fileToDelete) => {
    setNewAttachments(
      (prevNewAttachments) => prevNewAttachments.filter(
        (attachment) => attachment.file.name !== fileToDelete.name
      )
    );

    tracker.track('Delete new attachment');
  }, [tracker]);

  const onNotesSaved = useCallback(() => {
    setEditedExistingNotes({});
    setNewNotes((prevNewNotes) => prevNewNotes.filter((note) => !newNotesWithText.includes(note)));
  }, [newNotesWithText]);

  const onAttachmentsUploaded = useCallback((uploadedAttachments) => {
    setNewAttachments((prevNewAttachments) => prevNewAttachments.filter(
      (attachment) => !uploadedAttachments.includes(attachment)
    ));
  }, []);

  // Held stable so that a caller can hand these straight to a memoized footer
  // or activity section, and so its own save handlers can depend on the lot.
  return useMemo(() => ({
    editedNotes,
    hasStagedChanges: !!notesUpdate || newAttachments.length > 0,
    isAddNoteDisabled: newNotes.some((noteToAdd) => !noteToAdd.originalText),
    newAttachments,
    newNotes,
    notesUpdate,
    onAddAttachments,
    onAddNote,
    onAttachmentsUploaded,
    onCancelNote,
    onChangeNote,
    onDeleteAttachment,
    onDeleteNote,
    onDoneNote,
    onNotesSaved,
    patrolAttachments,
  }), [
    editedNotes,
    newAttachments,
    newNotes,
    notesUpdate,
    onAddAttachments,
    onAddNote,
    onAttachmentsUploaded,
    onCancelNote,
    onChangeNote,
    onDeleteAttachment,
    onDeleteNote,
    onDoneNote,
    onNotesSaved,
    patrolAttachments,
  ]);
};

export default usePatrolActivityEditing;
