import React, { memo, useEffect, useState, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';
import SplitButton from 'react-bootstrap/SplitButton';
import Dropdown from 'react-bootstrap/Dropdown';

import LoadingOverlay from '../LoadingOverlay';

import { downloadFileFromUrl, fetchImageAsBase64FromUrl } from '../utils/file';
import { eventBelongsToCollection, generateSaveActionsForReport, executeReportSaveActions, createNewIncidentCollection, openModalForReport } from '../utils/events';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { extractObjectDifference } from '../utils/objects';
import { trackEvent } from '../utils/analytics';

import { getReportFormSchemaData } from '../selectors';
import { addModal } from '../ducks/modals';
import { createEvent, addEventToIncident, fetchEvent } from '../ducks/events';

import StateButton from './StateButton';
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
  const { map, report: originalReport, removeModal, onSaveSuccess, onSaveError, updateModal, relationshipButtonDisabled,
    schema, uiSchema, addModal, createEvent, addEventToIncident, fetchEvent } = props;

  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);
  const [initialized, setInitState] = useState(false);
  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [notesToAdd, updateNotesToAdd] = useState([]);
  const [saveError, setSaveErrorState] = useState(null);
  const [saving, setSavingState] = useState(false);

  useEffect(() => {
    updateStateReport({
      ...originalReport,
      ...report,
      event_details: {
        ...originalReport.event_details,
        ...report.event_details,
      },
    });
    updateFilesToUpload([]);
    updateNotesToAdd([]);
  }, [originalReport]);

  useEffect(() => {
    if (!initialized) {
      setInitState(true);
    } else {
      startSave();
    }
  }, [report.state]);

  useEffect(() => {
    if (saving) {
      onSubmit();
    }
  }, [saving]);

  const reportFiles = Array.isArray(report.files) ? report.files : [];
  const reportNotes = Array.isArray(report.notes) ? report.notes : [];

  const { is_collection } = report;
  const disableAddReport = relationshipButtonDisabled;

  const onCancel = () => {
    removeModal();
    trackEvent(`${is_collection? 'Incident': 'Event'} Report`, "Click 'Cancel' button");
  };

  const goToBottomOfForm = () => {
    if (formRef.current && formRef.current.formElement) {
      formRef.current.formElement.scrollTop = formRef.current.formElement.scrollHeight;
    }
  };

  const onAddFiles = files => {
    const uploadableFiles = files.filter((file) => {
      const { name } = file;
      const filenameExists =
        filesToUpload.some(({ name: n }) => n === name)
        || reportFiles.some(({ filename: n }) => n === name);

      if (filenameExists) {
        window.alert(`Can not add ${name}: 
        file already exists`);
      }
      return !filenameExists;
    });
    updateFilesToUpload([...filesToUpload, ...uploadableFiles]);
    goToBottomOfForm();
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Added Attachment");
  };

  const onDeleteFile = (file) => {
    const { name } = file;
    updateFilesToUpload(filesToUpload.filter(({ name: n }) => n !== name));
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Delete Attachment' button");
  };

  const startEditNote = (note) => {
    addModal({
      content: NoteModal,
      note,
      onSubmit: onSaveNote,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Open Report Note");
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
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Save Note' button");
  };

  const onDeleteNote = (note) => {
    const { text } = note;
    updateNotesToAdd(notesToAdd.filter(({ text: t }) => t !== text));
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Delete Note' button");
  };

  const onReportedByChange = selection => {
    updateStateReport({
      ...report,
      reported_by: selection ? selection : null,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Change Report Report By");
  };

  const onReportDateChange = date => {
    updateStateReport({
      ...report,
      time: date.toISOString(),
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Change Report Date");
  };

  const onReportTitleChange = title => {
    updateStateReport({
      ...report,
      title,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Change Report Title");
  };

  const onDetailChange = ({ formData }) => updateStateReport({
    ...report,
    event_details: {
      ...report.event_details,
      ...formData,
    },
  });

  const onPrioritySelect = priority => {
    updateStateReport({
      ...report,
      priority,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Priority' option", `Priority:${priority}`);
  };

  const onReportLocationChange = location => {
    const updatedLocation = !!location
      ? {
        latitude: location[1],
        longitude: location[0],
      } : location;

    updateStateReport({
      ...report,
      location: updatedLocation,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Change Report Location");
  };

  const goToParentCollection = () => {
    const { is_contained_in: [{ related_event: { id: incidentID } }] } = report;
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Go to Incident' button");
    return fetchEvent(incidentID).then(({ data: { data } }) => {
      removeModal();
      openModalForReport(data, map);
      // removeModal();
    });
  };

  const onIncidentReportClick = (report) => {
    trackEvent('Incident Report', 
      `Open ${report.is_collection?'Incident':'Event'} Report from Incident`, 
      `Event Type:${report.event_type}`);
    return fetchEvent(report.id).then(({ data: { data } }) => {
      openModalForReport(data, map, { relationshipButtonDisabled: true });
    });
  };

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
      if (changes.event_details) {
        toSubmit.event_details = report.event_details;
      }
    }

    trackEvent(`${is_collection?'Incident':'Event'} Report`, `Click 'Save' button for ${reportIsNew?'new':'existing'} report`);

    const actions = generateSaveActionsForReport(toSubmit, notesToAdd, filesToUpload);

    return executeReportSaveActions(actions)
      .then((results) => {
        onSaveSuccess(results);
        return results;
      })
      .catch(handleSaveError);
  };

  const onSubmit = () => {
    return saveChanges()
      .then((results) => {
        removeModal();
        return results;
      });
  };

  const startSave = () => {
    setSavingState(true);
  };

  const clearErrors = () => setSaveErrorState(null);

  const handleSaveError = (e) => {
    setSavingState(false);
    setSaveErrorState(e);
    onSaveError && onSaveError(e);
    setTimeout(clearErrors, 7000);
  };

  const onClickFile = async (file) => {
    if (file.file_type === 'image') {
      const fileData = await fetchImageAsBase64FromUrl(file.images.original);
        
      addModal({
        content: ImageModal,
        src: fileData,
        title: file.filename,
      });
    } else {
      await downloadFileFromUrl(file.url, file.filename);
    }
    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Open Report Attachment");
  };

  const onAddToNewIncident = async () => {
    const incident = createNewIncidentCollection({ priority: report.priority });

    const { data: { data: newIncident } } = await createEvent(incident);
    const [{ data: { data: thisReport } }] = await saveChanges();
    await addEventToIncident(thisReport.id, newIncident.id);

    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Add To Incident' button");

    return fetchEvent(newIncident.id).then(({ data: { data } }) => {
      openModalForReport(data, map);
      removeModal();
    });
  };

  const onAddToExistingIncident = async (incident) => {
    const [{ data: { data: thisReport } }] = await saveChanges();
    await addEventToIncident(thisReport.id, incident.id);

    trackEvent(`${is_collection?'Incident':'Event'} Report`, "Click 'Add To Incident' button");

    return fetchEvent(incident.id).then(({ data: { data } }) => {
      openModalForReport(data, map);
      removeModal();
    });
  };

  const onReportAdded = ([{ data: { data: newReport } }]) => {
    try {
      saveChanges()
        .then(async ([{ data: { data: thisReport } }]) => {
          if (is_collection) {
            await addEventToIncident(newReport.id, thisReport.id);
            return fetchEvent(thisReport.id).then(({ data: { data } }) => {
              openModalForReport(data, map);
              removeModal();
            });
          } else {
            const { data: { data: { id: incidentID } } } = await createEvent(
              createNewIncidentCollection({ priority: Math.max(thisReport.priority, newReport.priority) })
            );
            await Promise.all([thisReport.id, newReport.id].map(id => addEventToIncident(id, incidentID)));
            return fetchEvent(incidentID).then(({ data: { data } }) => {
              openModalForReport(data, map);
              removeModal();
            });
          }
        });
    } catch (e) {
      handleSaveError(e);
    }
  };

  const onUpdateStateReportToggle = (state) => {
    updateStateReport({ ...report, state });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, `Click '${state=='resolved'?'Resolve':'Reopen'}' button`);
  };

  const filesToList = [...reportFiles, ...filesToUpload];
  const notesToList = [...reportNotes, ...notesToAdd];

  const Controls = <Fragment>
    <ReportFormAttachmentList
      files={filesToList}
      notes={notesToList}
      onClickFile={onClickFile}
      onClickNote={startEditNote}
      onDeleteNote={onDeleteNote}
      onDeleteFile={onDeleteFile} />
    <div className={styles.bottomControls}>
      <ReportFormAttachmentControls
        isCollection={is_collection}
        isCollectionChild={eventBelongsToCollection(report)}
        onGoToCollection={goToParentCollection}
        relationshipButtonDisabled={disableAddReport}
        map={map} onAddFiles={onAddFiles}
        onSaveNote={onSaveNote} onNewReportSaved={onReportAdded} />
      <div className={styles.formButtons}>
        <Button type="button" onClick={onCancel} variant="secondary">Cancel</Button>
        {/* <Button type="submit" variant="primary">Save</Button> */}
        <SplitButton className={styles.saveButton} drop='down' variant='primary' type='submit' title='Save' onClick={startSave}>
          <Dropdown.Item>
            <StateButton isCollection={report.is_collection} state={report.state} onStateToggle={state => onUpdateStateReportToggle(state)} />
          </Dropdown.Item>
        </SplitButton>
      </div>
    </div>
  </Fragment>;

  return <div className={styles.wrapper}>
    {saving && <LoadingOverlay message='Saving...' className={styles.loadingOverlay} />}
    {saveError && <ReportFormErrorMessages onClose={clearErrors} errorData={saveError} />}

    <ReportFormHeader
      report={report}
      onReportTitleChange={onReportTitleChange}
      onPrioritySelect={onPrioritySelect}
      onAddToNewIncident={onAddToNewIncident}
      onAddToExistingIncident={onAddToExistingIncident} />

    {!is_collection && <ReportFormTopLevelControls
      map={map}
      onReportDateChange={onReportDateChange}
      onReportedByChange={onReportedByChange}
      onReportLocationChange={onReportLocationChange}
      report={report} />}

    {is_collection && <IncidentReportsList reports={report.contains} 
      onReportClick={onIncidentReportClick}>
      {Controls}
    </IncidentReportsList>}
    {!is_collection && <ReportFormBody
      ref={formRef}
      formData={unwrapEventDetailSelectValues(report.event_details)}
      onChange={onDetailChange}
      onSubmit={startSave}
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
  addModal,
  createEvent: (...args) => createEvent(...args),
  addEventToIncident: (...args) => addEventToIncident(...args),
  fetchEvent: id => fetchEvent(id),
})(memo(ReportForm));

ReportForm.defaultProps = {
  relationshipButtonDisabled: false,
  onSaveSuccess() {
  },
  onSaveError(e) {
    console.log('error saving report', e);
  },
};

ReportForm.propTypes = {
  relationshipButtonDisabled: PropTypes.bool,
  report: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};
