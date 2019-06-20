import React, { memo, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import Form from 'react-jsonschema-form';

import { uploadFiles, downloadFileFromUrl } from '../utils/file';
import { generateSaveActionsForReportForm } from '../utils/events';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { extractObjectDifference } from '../utils/objects';

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import { getReportFormSchemaData } from '../selectors';
import { addModal, removeModal, setModalVisibilityState } from '../ducks/modals';

import ReportFormAttachmentControls from './AttachmentControls';
import ReportFormTopLevelControls from './TopLevelControls';
import ReportFormAttachmentList from './AttachmentList';
import ReportFormHeader from './Header';
import NoteModal from '../NoteModal';
import ImageModal from '../ImageModal';

import styles from './styles.module.scss';

const ReportForm = memo((props) => {
  const { id, map, report: originalReport, removeModal, onSubmit, schema, uiSchema, addModal, setModalVisibilityState } = props;
  const additionalMetaSchemas = [draft4JsonSchema];

  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);

  const [filesToUpload, updateFilesToUpload] = useState([]);

  const [notesToAdd, updateNotesToAdd] = useState([]);

  useEffect(() => {
    return () => {
      setModalVisibilityState(true);
    };
  }, []);

  /* TODO - WHY ARE MAP EVENTS NOT LISTING THIS INFO CORRECTLY?? GEOJSON PARSING BULLSHIT IS LIKELY */
  const reportFiles = Array.isArray(report.files) ? report.files : [];
  const reportNotes = Array.isArray(report.notes) ? report.notes : [];

  const { is_collection } = report;

  const onCancel = () => removeModal(id);

  const goToBottomOfForm = () => {
    const { formElement } = formRef.current;
    formElement.scrollTop = formElement.scrollHeight;
  };

  const onAddFiles = files => {
    files.forEach((file) => {
      const { name } = file;
      const filenameExists =
        filesToUpload.some(({ name: n }) => n === name)
        || reportFiles.some(({ filename: n }) => n === name);

      if (filenameExists) {
        window.alert(`Can not add ${name}: 
        file already exists`);
      } else {
        updateFilesToUpload([...filesToUpload, file]);
      }
    });
    goToBottomOfForm();
  };

  const onDeleteFile = (file) => {
    const { name } = file;
    updateFilesToUpload(filesToUpload.filter(({ name: n }) => n !== name));
  };

  const startEditNote = (note) => {
    addModal({
      content: NoteModal,
      note,
      onSubmit: onSaveNote,
    });
  };

  const onSaveNote = (noteToSave) => {
    const note = { ...noteToSave };
    const noteIsNew = !note.id;

    if (noteIsNew) {
      const { originalText } = note;

      if (originalText) {
        updateNotesToAdd(
          notesToAdd.map(n => n.text === originalText ? note : n)
        );
      } else {
        updateNotesToAdd([...notesToAdd, note]);
      }
      delete note.originalText;
    } else {
      updateStateReport({
        ...report,
        notes: report.notes.map(n => n.id === note.id ? note : n),
      });
    }
    goToBottomOfForm();
  };

  const onDeleteNote = (note) => {
    const { text } = note;
    updateNotesToAdd(notesToAdd.filter(({ text: t }) => t !== text));
  };

  const onReportedByChange = selection => updateStateReport({
    ...report,
    reported_by: selection ? selection : null,
  });

  const onReportDateChange = date => updateStateReport({
    ...report,
    time: date.toISOString(),
  });


  const onReportTitleChange = title => updateStateReport({
    ...report,
    title,
  });

  const onDetailChange = ({ formData }) => updateStateReport({
    ...report,
    event_details: {
      ...report.event_details,
      ...formData,
    },
  });

  const onPrioritySelect = priority => updateStateReport({
    ...report,
    priority,
  });

  const onReportLocationChange = location => updateStateReport({
    ...report,
    location: !!location
      ? {
        latitude: location[1],
        longitude: location[0],
      } : location,
  });

  const onClickAddReport = () => null;

  const handleFormSubmit = () => {
    const changes = extractObjectDifference(report, originalReport);

    /* the ID never changes, so carry it over */
    if (report.id) {
      changes.id = report.id;
    }

    /* the API requires an array value, even if no notes exist */
    // changes.notes = changes.notes ? changes.notes : [];

    /* reported_by requires the entire object. bring it over if it's changed and needs updating. */
    if (changes.reported_by) {
      changes.reported_by = report.reported_by;
    }

    const saveActions = generateSaveActionsForReportForm(changes, notesToAdd, filesToUpload);
    let eventID;

    console.log('changes', changes);

    console.log('my saveActions', saveActions);

    saveActions.reduce(async (action, { action: nextAction }, index) => {
      if (index === 0) return nextAction();

      const isPrimaryAction = index === 1;
      const results = await action;

      if (isPrimaryAction) {
        eventID = results.data.data.id;
      }

      return nextAction(eventID);

    }, null);
  };

  const onClickFile = (file) => {
    if (file.file_type === 'image') {
      addModal({
        content: ImageModal,
        src: file.images.original,
        title: file.filename,
      });
    } else {
      downloadFileFromUrl(file.url, file.filename);
    }
  };

  const filesToList = [...filesToUpload, ...reportFiles];
  const notesToList = [...notesToAdd, ...reportNotes];

  return <div className={styles.wrapper}>
    <ReportFormHeader report={report} onReportTitleChange={onReportTitleChange} onPrioritySelect={onPrioritySelect} />

    {!is_collection && <ReportFormTopLevelControls
      map={map}
      onReportDateChange={onReportDateChange}
      onReportedByChange={onReportedByChange}
      onReportLocationChange={onReportLocationChange}
      report={report} />}

    <Form
      additionalMetaSchemas={additionalMetaSchemas}
      className={styles.form}
      formData={unwrapEventDetailSelectValues(report.event_details)}
      ref={formRef}
      schema={schema}
      uiSchema={uiSchema}
      onChange={onDetailChange}
      onSubmit={handleFormSubmit}
      safeRenderCompletion={true}
    >
      <ReportFormAttachmentList
        files={filesToList}
        notes={notesToList}
        onClickFile={onClickFile}
        onClickNote={startEditNote}
        onDeleteNote={onDeleteNote}
        onDeleteFile={onDeleteFile} />
      <div className={styles.bottomControls}>
        <ReportFormAttachmentControls map={map} onAddFiles={onAddFiles} onSaveNote={onSaveNote} onClickAddReport={onClickAddReport} />
        <div className={styles.formButtons}>
          <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </div>
    </Form>
  </div>;
});

const mapStateToProps = (state, props) => ({
  ...getReportFormSchemaData(state, props),
});

export default connect(mapStateToProps, { addModal, removeModal, setModalVisibilityState })(ReportForm);

ReportForm.defaultProps = {
  onSaveSuccess() {

  },
};

ReportForm.propTypes = {
  report: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  map: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  onSaveSuccess: PropTypes.func,
};
