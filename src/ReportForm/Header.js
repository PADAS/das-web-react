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
import DateTime from '../DateTime';

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
  const menuRef = useRef(null);
  const historyRef = useRef(null);
  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverState] = useState(false);

  const reportTitle = displayTitleForEventByEventType(report);
  const reportBelongsToCollection = !!report.is_contained_in && !!report.is_contained_in.length;
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;
  const eventOrIncidentReport = `${report.is_collection? 'Incident' : 'Event'} Report`;
  const updateTime = report.updated_at || report.created_at;

  const onStartAddToIncident = () => {
    trackEvent(eventOrIncidentReport, `Click 'Add to Incident'`);
    setHeaderPopoverState(false);
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  };

  const onHamburgerMenuIconClick = () => {
    setHeaderPopoverState(!headerPopoverOpen)
    trackEvent(eventOrIncidentReport, `${headerPopoverOpen?'Close':'Open'} Hamburger Menu`);
  };

  const onReportHistoryClick = () => {
    setHistoryPopoverState(!historyPopoverOpen);
    trackEvent(eventOrIncidentReport, `${historyPopoverOpen?'Close':'Open'} Report History`);
  };

  const ReportHistory = 
    <span ref={historyRef} onClick={onReportHistoryClick} className={styles.reportHistory}>
      {report.updates.length > 1? 'Updated' : 'Created'} <TimeAgo date={updateTime}/>
    </span>
  ;

  // TODO:Refactor popover className once we standardize popover styles:
  // remove style.reportPopover and style.popoverHeader
  const ReportHeaderPopover = <Popover placement='auto' className={styles.reportPopover}>
    <Popover.Title className={styles.popoverHeader}>{eventOrIncidentReport}</Popover.Title>
    <Popover.Content className={styles.headerPopoverContent}>
      <h6>Priority:</h6>
      <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
      {canAddToIncident && <Fragment>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={onStartAddToIncident}>
          <AddToIncidentIcon style={{height: '2rem', width: '2rem'}} />Add to incident
        </Button>
      </Fragment>
      }
    </Popover.Content>
  </Popover>;

  // TODO:Refactor popover className once we standardize popover styles:
  // remove style.reportPopover and style.popoverHeader
  const ReportHistoryPopover = <Popover placement='right' className={styles.reportPopover}>
    <Popover.Title className={styles.popoverHeader}>History</Popover.Title>
    <Popover.Content className={styles.historyPopoverContent}>
      <ul>
        {report.updates.map((update) =>
          <li className={styles.listItem} key={update.time}>
            <div className={styles.historyItem}>
              <div className={styles.historyDetails}>
                <div className={styles.historyMessage}>{update.message.replace(/by (\w+\b)( \w+\b)?$/g, '')}</div>
                <div className={styles.historyUser}>{`${update.user.first_name} ${update.user.last_name}`.trim()}</div>
              </div>
              <DateTime className={styles.historyDate} date={update.time}/>
            </div>
          </li>
        )}
      </ul>
    </Popover.Content>
  </Popover>;

  return <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
    <h4>
      <EventIcon className={styles.icon} iconId={report.icon_id.replace('.svg', '')} />
      {report.serial_number && `${report.serial_number}:`}
      <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      <div className={styles.headerDetails}>
        <HamburgerMenuIcon ref={menuRef} isOpen={headerPopoverOpen} onClick={onHamburgerMenuIconClick} />
        <Overlay show={headerPopoverOpen} target={menuRef.current} shouldUpdatePosition={true} 
          onHide={() => setHeaderPopoverState(false)} placement='auto' rootClose trigger='click'>
          {ReportHeaderPopover}
        </Overlay>
        {ReportHistory}          
        <Overlay show={historyPopoverOpen} target={historyRef.current} shouldUpdatePosition={true} 
          onHide={() => setHistoryPopoverState(false)} placement='right' rootClose trigger='click'>
          {ReportHistoryPopover}
        </Overlay>
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