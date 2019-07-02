import React, { memo, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import { addModal } from '../ducks/modals';

import PriorityPicker from '../PriorityPicker';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import AddToIncidentModal from './AddToIncidentModal';

import { displayTitleForEventByEventType } from '../utils/events';

import styles from './styles.module.scss';

const calcClassNameForPriority = (priority) => {
  if (priority === 300) return 'highPriority';
  if (priority === 200) return 'mediumPriority';
  if (priority === 100) return 'lowPriority';
  return 'noPriority';
};


const ReportFormHeader = (props) => {
  const { addModal, report, onReportTitleChange, onPrioritySelect, onAddToNewIncident, onAddToExistingIncident } = props;
  const reportTitle = displayTitleForEventByEventType(report);

  const reportBelongsToCollection = !!report.is_contained_in && !!report.is_contained_in.length;
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;

  const onStartAddToIncident = () => {
    setHeaderPopoverState(false);
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  };

  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);

  const ReportHeaderPopover = <Popover placement='auto' className={styles.popover}>
    <h6>Priority:</h6>
    <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
    <br />
    {canAddToIncident && <Button variant='secondary' onClick={onStartAddToIncident}>Add to incident</Button>}
  </Popover>;


  return <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
    <h4>
      <EventIcon className={styles.icon} iconId={report.icon_id.replace('.svg', '')} />
      {report.serial_number && `${report.serial_number}:`}
      <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      <OverlayTrigger shouldUpdatePosition={true} onExiting={() => setHeaderPopoverState(false)} placement='auto' rootClose trigger='click' overlay={ReportHeaderPopover}>
        <HamburgerMenuIcon isOpen={headerPopoverOpen} onClick={() => setHeaderPopoverState(!headerPopoverOpen)} />
      </OverlayTrigger>
    </h4>
  </div>;
};


export default connect(null, { addModal })(memo(ReportFormHeader));

ReportFormHeader.propTypes = {
  report: PropTypes.object.isRequired,
  onReportTitleChange: PropTypes.func.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
  onAddToNewIncident: PropTypes.func.isRequired,
  onAddToExistingIncident:  PropTypes.func.isRequired,
};