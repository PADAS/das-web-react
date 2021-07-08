import React, { Fragment, memo, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import LoadingOverlay from '../LoadingOverlay';

import { fetchImageAsBase64FromUrl, filterDuplicateUploadFilenames } from '../utils/file';
import { downloadFileFromUrl } from '../utils/download';
import { openModalForPatrol } from '../utils/patrols';
import { addPatrolSegmentToEvent, eventBelongsToCollection, eventBelongsToPatrol, createNewIncidentCollection, openModalForReport, displayTitleForEvent, eventTypeTitleForEvent  } from '../utils/events';
import { calcTopRatedReportAndTypeForCollection  } from '../utils/event-types';
import { generateSaveActionsForReportLikeObject, executeSaveActions } from '../utils/save';
import { extractObjectDifference } from '../utils/objects';
import { trackEvent } from '../utils/analytics';

import { getReportFormSchemaData } from '../selectors';
import { addModal } from '../ducks/modals';
import { fetchPatrol } from '../ducks/patrols';
import { createEvent, addEventToIncident, fetchEvent, setEventState } from '../ducks/events';

import EventIcon from '../EventIcon';

import IncidentReportsList from './IncidentReportsList';
import ReportFormTopLevelControls from './TopLevelControls';
import ReportFormErrorMessages from './ErrorMessages';
import RelationshipButton from './RelationshipButton';


import EditableItem from '../EditableItem';
import HeaderMenuContent from './HeaderMenuContent';
import AddToIncidentModal from './AddToIncidentModal';
import AddToPatrolModal from './AddToPatrolModal';

import { withFormDataContext } from '../EditableItem/context';

import ReportFormBody from './ReportFormBody';
import NoteModal from '../NoteModal';
import ImageModal from '../ImageModal';

const ACTIVE_STATES = ['active', 'new'];

const reportIsActive = (state) => ACTIVE_STATES.includes(state) || !state;

const ReportForm = (props) => {
  const { eventTypes, map, data: originalReport, fetchPatrol, formProps = {}, removeModal, onSaveSuccess, onSaveError,
    schema, uiSchema, addModal, createEvent, addEventToIncident, fetchEvent, setEventState, isPatrolReport } = props;

  const { navigateRelationships, relationshipButtonDisabled } = formProps;

  const formRef = useRef(null);
  const submitButtonRef = useRef(null);
  const reportedBySelectPortalRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const [report, updateStateReport] = useState({ ...originalReport });
  const [initialized, setInitState] = useState(false);
  const [filesToUpload, updateFilesToUpload] = useState([]);
  const [notesToAdd, updateNotesToAdd] = useState([]);
  const [saveError, setSaveErrorState] = useState(null);
  const [saving, setSavingState] = useState(false);

  const { is_collection } = report;

  const reportTitle = displayTitleForEvent(report, eventTypes);
  const reportTypeTitle = eventTypeTitleForEvent(report);

  const isActive = reportIsActive(report.state);

  const displayPriority = useMemo(() => {
    if (!!report.priority) return report.priority;

    if (report.is_collection) {
      const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
      if (!topRatedReportAndType) return report.priority;

      return (topRatedReportAndType.related_event && !!topRatedReportAndType.related_event.priority) ?
        topRatedReportAndType.related_event.priority 
        : (topRatedReportAndType.event_type && !!topRatedReportAndType.event_type.default_priority) ?
          topRatedReportAndType.event_type.default_priority
          : report.priority;
    }

    return report.priority;
  }, [eventTypes, report]);

  const handleSaveError = useCallback((e) => {
    setSavingState(false);
    setSaveErrorState(e);
    onSaveError && onSaveError(e);
    setTimeout(clearErrors, 7000);
  }, [onSaveError]);

  const saveChanges = useCallback(() => {
    const reportIsNew = !report.id;
    let toSubmit;

    if (reportIsNew) {
      toSubmit = report;
    } else {
      const changes = extractObjectDifference(report, originalReport);

      toSubmit = {
        ...changes,
        id: report.id,
        event_details: {
          ...originalReport.event_details,
          ...(!!changes && changes.event_details),
        },
      };

      /* reported_by requires the entire object. bring it over if it's changed and needs updating. */
      if (changes.reported_by) {
        toSubmit.reported_by = {
          ...report.reported_by,
          ...changes.reported_by,
        };
      }

      /* the API doesn't handle inline PATCHes of notes reliably, so if a note change is detected just bring the whole Array over */
      if (changes.notes) {
        toSubmit.notes = report.notes;
      }

      /* the API doesn't handle PATCHes of `contains` prop for incidents */
      if (toSubmit.contains) {
        delete toSubmit.contains;
      }
    }

    if (toSubmit.hasOwnProperty('location') && !toSubmit.location) {
      toSubmit.location = null;
    }

    trackEvent(`${is_collection?'Incident':'Event'} Report`, `Click 'Save' button for ${reportIsNew?'new':'existing'} report`);

    const actions = generateSaveActionsForReportLikeObject(toSubmit, 'report', notesToAdd, filesToUpload);

    return executeSaveActions(actions)
      .then((results) => {
        onSaveSuccess(results);
        if (report.is_collection && toSubmit.state) {
          return Promise.all(report.contains
            .map(contained => contained.related_event.id)
            .map(id => setEventState(id, toSubmit.state)));
        }
        return results;
      })
      .catch(handleSaveError);
  }, [filesToUpload, handleSaveError, is_collection, notesToAdd, onSaveSuccess, originalReport, report, setEventState]);

  useEffect(() => {
    if (!initialized) {
      setInitState(true);
    } else {
      startSave();
    }
  }, [isActive]); // eslint-disable-line

  useEffect(() => {
    const onSubmit = () => {
      return saveChanges()
        .then((results) => {
          removeModal();
          return results;
        });
    };
    if (saving) {
      
      onSubmit();
    }
  }, [saving]); // eslint-disable-line

  const reportFiles = Array.isArray(report.files) ? report.files : [];
  const reportNotes = Array.isArray(report.notes) ? report.notes : [];

  const onCancel = () => {
    removeModal();
    trackEvent(`${is_collection? 'Incident': 'Event'} Report`, 'Click \'Cancel\' button');
  };

  const goToBottomOfForm = () => {
    if (formRef.current && formRef.current.formElement) {
      formRef.current.formElement.scrollTop = formRef.current.formElement.scrollHeight;
    }
  };

  const onAddFiles = files => {
    const uploadableFiles = filterDuplicateUploadFilenames([...reportFiles, ...filesToUpload], files);
    
    updateFilesToUpload([...filesToUpload, ...uploadableFiles]);
    goToBottomOfForm();
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Added Attachment');
  };

  const onDeleteFile = (file) => {
    const { name } = file;
    updateFilesToUpload(filesToUpload.filter(({ name: n }) => n !== name));
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Delete Attachment\' button');
  };

  const startEditNote = (note) => {
    addModal({
      content: NoteModal,
      note,
      onSubmit: onSaveNote,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Open Report Note');
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
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Save Note\' button');
  };

  const onDeleteNote = (note) => {
    const { text } = note;
    updateNotesToAdd(notesToAdd.filter(({ text: t }) => t !== text));
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Delete Note\' button');
  };

  const onReportedByChange = selection => {
    const updates = {
      reported_by: selection ? selection : null,
    };

    if (selection
      && selection.last_position 
      && selection.last_position.geometry 
      && selection.last_position.geometry.coordinates) {
      updates.location = {
        latitude: selection.last_position.geometry.coordinates[1],
        longitude: selection.last_position.geometry.coordinates[0],
      };
    }
    
    updateStateReport({
      ...report,
      ...updates,
    });
    
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Change Report Report By');
  };

  const onReportDateChange = date => {
    updateStateReport({
      ...report,
      time: date.toISOString(),
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Change Report Date');
  };

  const onReportTitleChange = title => {
    updateStateReport({
      ...report,
      title,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Change Report Title');
  };

  const onDetailChange = ({ formData }) => updateStateReport({
    ...report,
    event_details: {
      ...report.event_details,
      ...formData,
    },
  });

  const onPrioritySelect = useCallback((priority) => {
    updateStateReport({
      ...report,
      priority,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Priority\' option', `Priority:${priority}`);
  }, [is_collection, report]);

  const onReportLocationChange = useCallback((location) => {
    const updatedLocation = !!location
      ? {
        latitude: location[1],
        longitude: location[0],
      } : null;

    updateStateReport({
      ...report,
      location: updatedLocation,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Change Report Location');
  }, [is_collection, report]);

  const goToParentCollection = () => {
    const { is_contained_in: [{ related_event: { id: incidentID } }] } = report;
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Go to Incident\' button');
    return fetchEvent(incidentID).then(({ data: { data } }) => {
      removeModal();
      openModalForReport(data, map);
    });
  };

  const onIncidentReportClick = (report) => {
    trackEvent('Incident Report', 
      `Open ${report.is_collection?'Incident':'Event'} Report from Incident`, 
      `Event Type:${report.event_type}`);
    return fetchEvent(report.id).then(({ data: { data } }) => {
      openModalForReport(data, map, { navigateRelationships: false });
    });
  };

  const startSave = () => {
    setSavingState(true);
  };

  const startSubmitForm = useCallback(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  }, []);

  const clearErrors = () => setSaveErrorState(null);

  const onClickFile = async (file) => {
    if (file.file_type === 'image') {
      const fileData = await fetchImageAsBase64FromUrl(file.images.original);
        
      addModal({
        content: ImageModal,
        src: fileData,
        title: file.filename,
      });
    } else {
      await downloadFileFromUrl(file.url, { filename: file.filename });
    }
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Open Report Attachment');
  };

  const onAddToNewIncident = useCallback(async () => {
    const incident = createNewIncidentCollection(/* { priority: report.priority } */);

    const { data: { data: newIncident } } = await createEvent(incident);
    const [{ data: { data: thisReport } }] = await saveChanges();
    await addEventToIncident(thisReport.id, newIncident.id);

    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Add To Incident\' button');

    return fetchEvent(newIncident.id).then(({ data: { data } }) => {
      openModalForReport(data, map);
      removeModal();
    });
  }, [addEventToIncident, createEvent, fetchEvent, is_collection, map, removeModal, saveChanges]);

  const onAddToExistingIncident = useCallback(async (incident) => {
    const [{ data: { data: thisReport } }] = await saveChanges();
    await addEventToIncident(thisReport.id, incident.id);

    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Add To Incident\' button');

    return fetchEvent(incident.id).then(({ data: { data } }) => {
      openModalForReport(data, map);
      removeModal();
    });
  }, [addEventToIncident, fetchEvent, is_collection, map, removeModal, saveChanges]);

  const onAddToPatrol = useCallback(async (patrol) => {
    const patrolId = patrol.id;
    const patrolSegmentId = patrol?.patrol_segments?.[0]?.id;

    if (!patrolSegmentId) return;
    const [{ data: { data: thisReport } }] = await saveChanges();
    await addPatrolSegmentToEvent(patrolSegmentId, thisReport.id);

    trackEvent(`${is_collection?'Incident':'Event'} Report`, `Add ${is_collection?'Incident':'Event'} to Patrol`);

    return fetchPatrol(patrolId).then(({ data: { data } }) => {
      openModalForPatrol(data, map);
      removeModal();
    });
  }, [fetchPatrol, is_collection, map, removeModal, saveChanges]);

  const onStartAddToIncident = useCallback(() => {
    // trackEvent(eventOrIncidentReport, 'Click \'Add to Incident\'');
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  }, [addModal, onAddToExistingIncident, onAddToNewIncident]);

  const onStartAddToPatrol = useCallback(() => {
    addModal({
      content: AddToPatrolModal,
      onAddToPatrol,
    });
    trackEvent(`${is_collection?'Incident':'Event'} Report`, 'Click \'Add to Patrol\' button');
  }, [addModal, is_collection, onAddToPatrol]);

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
              createNewIncidentCollection(/* { priority: Math.max(thisReport.priority, newReport.priority) } */)
            );
            await Promise.all([thisReport.id, newReport.id].map(id => addEventToIncident(id, incidentID)));
            return fetchEvent(incidentID).then((results) => {
              onSaveSuccess(results);
              const { data: { data } } = results;
              openModalForReport(data, map);
              removeModal();
            });
          }
        });
    } catch (e) {
      handleSaveError(e);
    }
  };

  const onUpdateStateReportToggle = useCallback((state) => {
    updateStateReport({ ...report, state });
    startSubmitForm();
    trackEvent(`${is_collection?'Incident':'Event'} Report`, `Click '${state === 'resolved'?'Resolve':'Reopen'}' button`);
  }, [is_collection, report, startSubmitForm]);

  const filesToList = [...reportFiles, ...filesToUpload];
  const notesToList = [...reportNotes, ...notesToAdd];

  const styles = {};

  return <EditableItem.ContextProvider value={report}>
  
    {saving && <LoadingOverlay message='Saving...' className={styles.loadingOverlay} />}
    {saveError && <ReportFormErrorMessages onClose={clearErrors} errorData={saveError} />}

    <EditableItem.Header 
      icon={<EventIcon title={reportTypeTitle} report={report} />}
      menuContent={schema.readonly ? null : <HeaderMenuContent onPrioritySelect={onPrioritySelect} onStartAddToIncident={onStartAddToIncident} onStartAddToPatrol={onStartAddToPatrol} isPatrolReport={isPatrolReport}  />}
      priority={displayPriority} readonly={schema.readonly}
      title={reportTitle} onTitleChange={onReportTitleChange} />

    <div ref={reportedBySelectPortalRef} style={{padding: 0}}></div>

    <EditableItem.Body ref={scrollContainerRef}>
      {is_collection && <IncidentReportsList reports={report.contains} 
        onReportClick={onIncidentReportClick}>
        <EditableItem.AttachmentList
          files={filesToList}
          notes={notesToList}
          onClickFile={onClickFile}
          onClickNote={startEditNote}
          onDeleteNote={onDeleteNote}
          onDeleteFile={onDeleteFile} />
      </IncidentReportsList>}
      {!is_collection && <Fragment>
        <ReportFormTopLevelControls
          map={map}
          report={report}
          readonly={schema.readonly}
          menuContainerRef={reportedBySelectPortalRef.current}
          onReportDateChange={onReportDateChange}
          onReportedByChange={onReportedByChange}
          onReportLocationChange={onReportLocationChange} />
        <ReportFormBody
          ref={formRef}
          formData={report.event_details}
          formScrollContainer={scrollContainerRef.current}
          onChange={onDetailChange}
          onSubmit={startSave}
          schema={schema}
          uiSchema={uiSchema}>
          <EditableItem.AttachmentList
            files={filesToList}
            notes={notesToList}
            onClickFile={onClickFile}
            onClickNote={startEditNote}
            onDeleteNote={onDeleteNote}
            onDeleteFile={onDeleteFile} />
          <button ref={submitButtonRef} type='submit' style={{display: 'none'}}>Submit</button>
        </ReportFormBody>
      </Fragment>
      }
    </EditableItem.Body>
    {/* bottom controls */}
    {!schema.readonly && <EditableItem.AttachmentControls
      onAddFiles={onAddFiles}
      onSaveNote={onSaveNote} >

      {!relationshipButtonDisabled && <RelationshipButton
        isCollection={is_collection}
        removeModal={removeModal}
        map={map}
        navigateRelationships={navigateRelationships}
        isCollectionChild={eventBelongsToCollection(report)}
        isPatrolReport={eventBelongsToPatrol(report)}
        hidePatrols={true}
        onNewReportSaved={onReportAdded}
      />}

    </EditableItem.AttachmentControls>}

    <EditableItem.Footer readonly={schema.readonly} onCancel={onCancel} onSave={startSubmitForm} onStateToggle={onUpdateStateReportToggle} isActiveState={reportIsActive(report.state)}/>
    {schema.readonly && <h6>This entry is &quot;read only&quot; and may not be edited.</h6>}
  </EditableItem.ContextProvider>;
};

const mapStateToProps = (state, props) => ({
  eventTypes: state.data.eventTypes,
  ...getReportFormSchemaData(state, props),
});

export default memo(
  withFormDataContext(
    connect(
      mapStateToProps,
      {
        addModal,
        createEvent: (...args) => createEvent(...args),
        addEventToIncident: (...args) => addEventToIncident(...args),
        fetchEvent: id => fetchEvent(id),
        setEventState: (id, state) => setEventState(id, state),
        fetchPatrol: id => fetchPatrol(id),
      }
    )
    (ReportForm)
  )
);

ReportForm.defaultProps = {
  formProps: {},
  onSaveSuccess() {
  },
  onSaveError(e) {
    console.log('error saving report', e);
  },
};

ReportForm.propTypes = {
  formProps: PropTypes.object,
  data: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};
