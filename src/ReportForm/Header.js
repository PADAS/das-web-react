import React, { memo, useState, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';

import { addModal } from '../ducks/modals';

import { ReactComponent as AddToIncidentIcon } from '../common/images/icons/add-to-incident.svg';
import PriorityPicker from '../PriorityPicker';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import AddToIncidentModal from './AddToIncidentModal';

import { displayTitleForEventByEventType } from '../utils/events'; 
import { trackEvent } from '../utils/analytics';

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
  const menuRef = useRef(null);

  const reportBelongsToCollection = !!report.is_contained_in && !!report.is_contained_in.length;
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;

  const updateTime = report.updated_at || report.created_at;

  const onStartAddToIncident = () => {
    setHeaderPopoverState(false);
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  };

  const onHamburgerMenuIconClick = () => {
    setHeaderPopoverState(!headerPopoverOpen)
    trackEvent(`${report.is_collection?'Incident':'Event'} Reports`, `${headerPopoverOpen?'Close':'Open'}' Hamburger Menu`);
  };

  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);

  const ReportHeaderPopover = <Popover placement='auto' className={styles.popover}>
    <h6>Priority:</h6>
    <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
    <br />
    {canAddToIncident && <Fragment>
      <hr />
      <Button className={styles.addToIncidentBtn} variant='secondary' onClick={onStartAddToIncident}>
        <AddToIncidentIcon style={{height: '3rem', width: '3rem'}} /> Add to incident
      </Button>
    </Fragment>
    }
  </Popover>;


  return <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
    <h4>
      <EventIcon className={styles.icon} iconId={report.icon_id.replace('.svg', '')} />
      {report.serial_number && `${report.serial_number}:`}
      <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      <div className={styles.headerDetails}>
        <HamburgerMenuIcon ref={menuRef} isOpen={headerPopoverOpen} onClick={onHamburgerMenuIconClick} />
        <Overlay show={headerPopoverOpen} target={menuRef.current} shouldUpdatePosition={true} onHide={() => setHeaderPopoverState(false)} placement='auto' rootClose trigger='click'>
          {ReportHeaderPopover}
        </Overlay>
        {updateTime && <small>
          Updated <TimeAgo date={updateTime} />
        </small>}
        {report.state === 'resolved' && <small>resolved</small>}
      </div>
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