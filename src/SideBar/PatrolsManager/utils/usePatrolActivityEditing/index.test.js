import { act, renderHook } from '../../../../test-utils';

import usePatrolActivityEditing from './';

describe('SideBar - PatrolsManager - utils - usePatrolActivityEditing', () => {
  const EXISTING_NOTE = { id: 'note-1', text: 'A saved note' };

  let patrol, tracker;
  beforeEach(() => {
    patrol = { files: [], id: 'patrol-1', notes: [EXISTING_NOTE] };

    tracker = { track: jest.fn() };
  });

  const renderActivityEditing = (patrolOverride) => renderHook(
    () => usePatrolActivityEditing(patrolOverride ?? patrol, tracker)
  );

  test('holds what it returns stable while nothing the caller staged has changed', () => {
    const { rerender, result } = renderActivityEditing();

    const firstResult = result.current;
    rerender();

    expect(result.current).toBe(firstResult);
  });

  test('returns a new value once the caller stages something', () => {
    const { result } = renderActivityEditing();

    const firstResult = result.current;
    act(() => result.current.onAddNote());

    expect(result.current).not.toBe(firstResult);
  });

  test('lists the notes of the patrol', () => {
    const { result } = renderActivityEditing();

    expect(result.current.editedNotes).toEqual([{ ...EXISTING_NOTE, isUnsaved: false, originalText: 'A saved note' }]);
  });

  test('tolerates a patrol that carries no notes or files', () => {
    const { result } = renderActivityEditing({ id: 'patrol-1' });

    expect(result.current.editedNotes).toEqual([]);
    expect(result.current.patrolAttachments).toEqual([]);
  });

  test('has nothing staged to begin with', () => {
    const { result } = renderActivityEditing();

    expect(result.current.hasStagedChanges).toBe(false);
    expect(result.current.notesUpdate).toBeNull();
  });

  test('stages a new note, which does not count as a change until it has text', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());

    expect(result.current.newNotes).toHaveLength(1);
    expect(result.current.hasStagedChanges).toBe(false);
    expect(result.current.isAddNoteDisabled).toBe(true);
  });

  test('adds a written new note to the notes update', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());
    act(() => result.current.onChangeNote(result.current.newNotes[0], { target: { value: 'A new note' } }));

    expect(result.current.hasStagedChanges).toBe(true);
    expect(result.current.notesUpdate).toEqual([EXISTING_NOTE, { text: 'A new note' }]);
  });

  test('marks a new note as written once it is done', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());
    act(() => result.current.onChangeNote(result.current.newNotes[0], { target: { value: 'A new note' } }));
    act(() => result.current.onDoneNote(result.current.newNotes[0]));

    expect(result.current.isAddNoteDisabled).toBe(false);
  });

  test('drops a new note', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());
    act(() => result.current.onDeleteNote(result.current.newNotes[0]));

    expect(result.current.newNotes).toEqual([]);
  });

  test('edits an existing note and puts the edition in the notes update', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onChangeNote(result.current.editedNotes[0], { target: { value: 'An edited note' } }));

    expect(result.current.editedNotes[0].isUnsaved).toBe(true);
    expect(result.current.notesUpdate).toEqual([{ ...EXISTING_NOTE, text: 'An edited note' }]);
  });

  test('gives an edited existing note its saved text back when the edition is cancelled', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onChangeNote(result.current.editedNotes[0], { target: { value: 'An edited note' } }));
    act(() => result.current.onCancelNote(result.current.editedNotes[0]));

    expect(result.current.editedNotes[0].text).toBe('A saved note');
    expect(result.current.notesUpdate).toBeNull();
  });

  test('stages the attachments it is given', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddAttachments([new File([''], 'photo.png')]));

    expect(result.current.newAttachments.map((newAttachment) => newAttachment.file.name)).toEqual(['photo.png']);
    expect(result.current.hasStagedChanges).toBe(true);
  });

  test('drops a staged attachment', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddAttachments([new File([''], 'photo.png')]));
    act(() => result.current.onDeleteAttachment({ name: 'photo.png' }));

    expect(result.current.newAttachments).toEqual([]);
  });

  test('clears the notes a save persisted', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());
    act(() => result.current.onChangeNote(result.current.newNotes[0], { target: { value: 'A new note' } }));
    act(() => result.current.onChangeNote(result.current.editedNotes[0], { target: { value: 'An edited note' } }));
    act(() => result.current.onNotesSaved());

    expect(result.current.newNotes).toEqual([]);
    expect(result.current.notesUpdate).toBeNull();
  });

  test('clears only the attachments that were uploaded', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddAttachments([new File([''], 'uploaded.png'), new File([''], 'failed.png')]));
    act(() => result.current.onAttachmentsUploaded([result.current.newAttachments[0]]));

    expect(result.current.newAttachments.map((newAttachment) => newAttachment.file.name)).toEqual(['failed.png']);
  });

  test('reports what the user staged to the analytics tracker', () => {
    const { result } = renderActivityEditing();

    act(() => result.current.onAddNote());
    act(() => result.current.onAddAttachments([new File([''], 'photo.png')]));

    expect(tracker.track).toHaveBeenCalledWith('Added Note');
    expect(tracker.track).toHaveBeenCalledWith('Added Attachment');
  });
});
