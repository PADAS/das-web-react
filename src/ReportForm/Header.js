import React, { forwardRef, memo, useMemo, useState, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TimeAgo from '../TimeAgo';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';

import { addModal } from '../ducks/modals';

import { ReactComponent as AddToIncidentIcon } from '../common/images/icons/add-to-incident.svg';
import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';
import PriorityPicker from '../PriorityPicker';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import AddToIncidentModal from './AddToIncidentModal';
import DateTime from '../DateTime';

import { displayTitleForEvent, eventTypeTitleForEvent } from '../utils/events'; 
import { calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const ReportFormHeader = (props) => {
  const { addModal, eventTypes, report, onReportTitleChange, onPrioritySelect, onAddToNewIncident, onAddToExistingIncident } = props;
  const menuRef = useRef(null);
  const historyRef = useRef(null);
  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverState] = useState(false);

  const displayPriority = useMemo(() => {
    if (report.is_collection) {
      const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
      if (topRatedReportAndType) {
        return (topRatedReportAndType.related_event && !!topRatedReportAndType.related_event.priority) ?
          topRatedReportAndType.related_event.priority :
          (topRatedReportAndType.event_type && !!topRatedReportAndType.event_type.priority) ?
            topRatedReportAndType.event_type.default_priority : report.priority;
      } else {
        return  report.priority;
      }
    }
    return report.priority;
  }, [eventTypes, report]);

  const onReportTitleChangeCancel = () => {
    trackEvent('Event Report', 'Cancel Change Report Title');
  };

  const reportTitle = displayTitleForEvent(report);
  const reportTypeTitle = eventTypeTitleForEvent(report);
  const eventOrIncidentReport = `${report.is_collection? 'Incident' : 'Event'} Report`;
  const reportBelongsToCollection = !!report.is_contained_in && !!report.is_contained_in.length;
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;
  const hasExternalLink = (!!report.external_source && !!report.external_source.url);
  const updateTime = report.updated_at || report.created_at;

  const onStartAddToIncident = () => {
    trackEvent(eventOrIncidentReport, 'Click \'Add to Incident\'');
    setHeaderPopoverState(false);
    addModal({
      content: AddToIncidentModal,
      onAddToNewIncident,
      onAddToExistingIncident,
    });
  };

  const linkToReport = () => {
    setHeaderPopoverState(false);
    try {
      const url = report.external_source.url;
      window.open(url,'_blank');
    } catch (e) {
      console.log('error occured while opening external report', e);
    }
  };

  const handleEscapePress = (event) => {
    const { key } = event;
    if (key === 'Escape' 
    && (headerPopoverOpen || historyPopoverOpen)) {
      event.preventDefault();
      event.stopPropagation();
      setHeaderPopoverState(false);
      setHistoryPopoverState(false);
    }
  };
  
  const onHamburgerMenuIconClick = () => {
    setHeaderPopoverState(!headerPopoverOpen);
    trackEvent(eventOrIncidentReport, `${headerPopoverOpen?'Close':'Open'} Hamburger Menu`);
  };

  const onReportHistoryClick = () => {
    setHistoryPopoverState(!historyPopoverOpen);
    trackEvent(eventOrIncidentReport, `${historyPopoverOpen?'Close':'Open'} Report History`);
  };

  const ReportHistory = report.updates && <Fragment>
    <span ref={historyRef} onClick={onReportHistoryClick} className={styles.reportHistory}>
      {report.updates.length > 1 ? 'Updated' : 'Created'} <TimeAgo date={updateTime}/>
    </span>
  </Fragment>;

  const ReportHeaderPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} placement='auto' className={styles.headerPopover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>{eventOrIncidentReport}</Popover.Title>
    <Popover.Content>
      <h6>Priority:</h6>
      <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
      {canAddToIncident && <Fragment>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='link' onClick={onStartAddToIncident}>
          <AddToIncidentIcon style={{height: '2rem', width: '2rem'}} />Add to incident
        </Button>
      </Fragment>
      }
      {hasExternalLink && <Fragment> 
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={linkToReport}>
          <img src={report.external_source.icon_url} style={{height: '2rem', width: '2rem'}} alt={report.external_source.text} /> {report.external_source.text}
          <ExternalLinkIcon style={{height: '1rem', width: '1rem', marginLeft: '0.1rem'}} />
        </Button>
      </Fragment>
      }
    </Popover.Content>
  </Popover>);

  const ReportHistoryPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} placement='auto' className={styles.historyPopover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>History</Popover.Title>
    <Popover.Content>
      <ul>
        {report.updates && report.updates.map((update) =>
          <li className={styles.listItem} key={update.time}>
            <div className={styles.historyItem}>
              <div className={styles.historyDetails}>
                <div className={styles.historyMessage}>{update.message.replace(/ by [ \w+\b]*$/g, '')}</div>
                <div className={styles.historyUser}>{`${update.user.first_name} ${update.user.last_name}`.trim()}</div>
              </div>
              <DateTime className={styles.historyDate} date={update.time}/>
            </div>
          </li>
        )}
      </ul>
    </Popover.Content>
  </Popover>);

  return <div className={`${styles.formHeader} ${styles[`priority-${displayPriority}`]}`}  onKeyDown={handleEscapePress}>
    <h4 title={reportTypeTitle}>
      <EventIcon title={reportTypeTitle} className={styles.icon} report={report} />
      {report.serial_number && <span>{report.serial_number}</span>}
      <InlineEditable onCancel={onReportTitleChangeCancel} value={reportTitle} onSave={onReportTitleChange} />
      <div className={styles.headerDetails}>
        <HamburgerMenuIcon ref={menuRef} isOpen={headerPopoverOpen} onClick={onHamburgerMenuIconClick} />
        <Overlay show={headerPopoverOpen} target={menuRef.current} shouldUpdatePosition={true} rootClose
          onHide={() => setHeaderPopoverState(false)} placement='auto' trigger='click'>
          <ReportHeaderPopover />
        </Overlay>
        {ReportHistory}          
        <Overlay show={historyPopoverOpen} target={historyRef.current} shouldUpdatePosition={true} rootClose
          onHide={() => setHistoryPopoverState(false)} placement='right' trigger='click'>
          <ReportHistoryPopover />
        </Overlay>
        {report.state === 'resolved' && <small>resolved</small>}
      </div>
    </h4>
  </div>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });
export default connect(mapStateToProps, { addModal })(memo(ReportFormHeader));

ReportFormHeader.propTypes = {
  report: PropTypes.object.isRequired,
  onReportTitleChange: PropTypes.func.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
  onAddToNewIncident: PropTypes.func.isRequired,
  onAddToExistingIncident:  PropTypes.func.isRequired,
};
