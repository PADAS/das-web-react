import React, { memo, useEffect, useState, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import LoadingOverlay from '../LoadingOverlay';

import { downloadFileFromUrl } from '../utils/file';
import { eventBelongsToCollection, generateSaveActionsForReport, executeReportSaveActions, createNewIncidentCollection, openModalForReport } from '../utils/events';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { extractObjectDifference } from '../utils/objects';

import { getReportFormSchemaData } from '../selectors';
import { addModal, removeModal, updateModal, setModalVisibilityState } from '../ducks/modals';
import { createEvent, addEventToIncident, fetchEvent } from '../ducks/events';

import IncidentReportsList from './IncidentReportsList';
import ReportFormAttachmentControls from './AttachmentControls';
import ReportFormTopLevelControls from './TopLevelControls';
import ReportFormAttachmentList from './AttachmentList';
import ReportFormErrorMessages from './ErrorMessages';
import ReportFormHeader from './Header';
import ReportFormBody from './ReportFormBody';
import NoteModal from '../NoteModal';
import ImageModal from '../ImageModal';

import styles from './styles.module.scss';

const ReportForm = (props) => {
  const { id, map, report: originalReport, removeModal, onSaveSuccess, onSaveError, updateModal, addReportDisabled,
    schema, uiSchema, addModal, setModalVisibilityState, createEvent, addEventToIncident, fetchEvent } = props;

  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);

  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [notesToAdd, updateNotesToAdd] = useState([]);
  const [saveError, setSaveErrorState] = useState(null);

  const [saving, setSavingState] = useState(false);

  useEffect(() => {
    updateStateReport(originalReport);
    updateFilesToUpload([]);
    updateNotesToAdd([]);
  }, [originalReport]);

  const reportFiles = Array.isArray(report.files) ? report.files : [];
  const reportNotes = Array.isArray(report.notes) ? report.notes : [];

  const { is_collection } = report;
  const disableAddReport = addReportDisabled || eventBelongsToCollection(report);

  const onCancel = () => removeModal(id);

  const goToBottomOfForm = () => {
    if (formRef.current && formRef.current.formElement) {
      formRef.current.formElement.scrollTop = formRef.current.formElement.scrollHeight;
    }
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

  const saveChanges = () => {
    const reportIsNew = !report.id;
    let toSubmit;

    if (reportIsNew) {
      toSubmit = report;
    } else {
      const changes = extractObjectDifference(report, originalReport);

      toSubmit = {
        ...changes,
        id: report.id,
      };

      /* reported_by requires the entire object. bring it over if it's changed and needs updating. */
      if (changes.reported_by) {
        toSubmit.reported_by = report.reported_by;
      }

      /* the API doesn't handle inline PATCHes of notes reliably, so if a note change is detected just bring the whole Array over */
      if (changes.notes) {
        toSubmit.notes = report.notes;
      }

    }

    const actions = generateSaveActionsForReport(toSubmit, notesToAdd, filesToUpload);
    setSavingState(true);

    return executeReportSaveActions(actions)
      .then((results) => {
        onSaveSuccess(results);
        return results;
      })
      .catch(handleSaveError);
  };

  const handleFormSubmit = () => {
    return saveChanges()
      .then((results) => {
        removeModal(id);
        return results;
      });
  };

  const clearErrors = () => setSaveErrorState(null);

  const handleSaveError = (e) => {
    setSavingState(false);
    setSaveErrorState(e);
    onSaveError(e);
    setTimeout(clearErrors, 7000);
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

  const onReportAdded = ([{ data: { data: newReport } }]) => {
    try {
      saveChanges()
        .then(async ([{ data: { data: thisReport } }]) => {
          if (is_collection) {
            await addEventToIncident(newReport.id, thisReport.id);
            return fetchEvent(thisReport.id).then(({ data: { data } }) => {
              updateModal({
                id,
                report: data,
              });
              setSavingState(false);
            });
          } else {
            const { data: { data: { id: incidentID } } } = await createEvent(
              createNewIncidentCollection({ priority: Math.max(thisReport.priority, newReport.priority) })
            );
            await Promise.all([thisReport.id, newReport.id].map(id => addEventToIncident(id, incidentID)));
            return fetchEvent(incidentID).then(({ data: { data } }) => {
              openModalForReport(data, map);
              removeModal(id);
            });
          }
        });
    } catch (e) {
      handleSaveError(e);
    }
  };

  const filesToList = [...filesToUpload, ...reportFiles];
  const notesToList = [...notesToAdd, ...reportNotes];

  const Controls = <Fragment>
    <ReportFormAttachmentList
      files={filesToList}
      notes={notesToList}
      onClickFile={onClickFile}
      onClickNote={startEditNote}
      onDeleteNote={onDeleteNote}
      onDeleteFile={onDeleteFile} />
    <div className={styles.bottomControls}>
      <ReportFormAttachmentControls addReportDisabled={disableAddReport} map={map} onAddFiles={onAddFiles} onSaveNote={onSaveNote} onNewReportSaved={onReportAdded} />
      <div className={styles.formButtons}>
        <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>
        <Button type="submit" onClick={handleFormSubmit} variant="primary">Save</Button>
      </div>
    </div>
  </Fragment>;

  return <div className={styles.wrapper}>
    {saving && <LoadingOverlay message='Saving...' className={styles.loadingOverlay} />}
    {saveError && <ReportFormErrorMessages onClose={clearErrors} errorData={saveError} />}

    <ReportFormHeader report={report} onReportTitleChange={onReportTitleChange} onPrioritySelect={onPrioritySelect} />

    {!is_collection && <ReportFormTopLevelControls
      map={map}
      onReportDateChange={onReportDateChange}
      onReportedByChange={onReportedByChange}
      onReportLocationChange={onReportLocationChange}
      report={report} />}

    {is_collection && <IncidentReportsList reports={report.contains} onReportClick={(report) => console.log('clicky', report)}>
      {Controls}
    </IncidentReportsList>}
    {!is_collection && <ReportFormBody
      ref={formRef}
      formData={unwrapEventDetailSelectValues(report.event_details)}
      onChange={onDetailChange}
      onSubmit={handleFormSubmit}
      schema={schema}
      uiSchema={uiSchema}>
      {Controls}
    </ReportFormBody>}
  </div>;
};

const mapStateToProps = (state, props) => ({
  ...getReportFormSchemaData(state, props),
});

export default connect(mapStateToProps, {
  addModal, removeModal, updateModal, setModalVisibilityState,
  createEvent: (event) => createEvent(event),
  addEventToIncident: (event_id, incident_id) => addEventToIncident(event_id, incident_id),
  fetchEvent: id => fetchEvent(id),
})(memo(ReportForm));

ReportForm.defaultProps = {
  addReportDisabled: false,
  onSaveSuccess() {
    console.log('save success!');
  },
  onSaveError(e) {
    console.log('error with stuff', e);
  },
};

ReportForm.propTypes = {
  addReportDisabled: PropTypes.bool,
  report: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  map: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};
