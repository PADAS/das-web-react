import React, { memo, useState, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';
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

  const ReportHeaderPopover = <Popover placement='auto' className={styles.headerPopover}>
    <Popover.Title>{eventOrIncidentReport}</Popover.Title>
    <Popover.Content>
      <h6>Priority:</h6>
      <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
      {canAddToIncident && <Fragment>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={onStartAddToIncident}>
          <AddToIncidentIcon style={{height: '2rem', width: '2rem'}} />Add to incident
        </Button>
      </Fragment>
      }
      {hasExternalLink && <Fragment> 
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={linkToReport}>
          <img src={report.external_source.icon_url} style={{height: '2rem', width: '2rem'}} /> {report.external_source.text}
          <ExternalLinkIcon style={{height: '1rem', width: '1rem', marginLeft: '0.1rem'}} />
        </Button>
      </Fragment>
      }
    </Popover.Content>
  </Popover>;

  const ReportHistoryPopover = <Popover placement='auto' className={styles.historyPopover}>
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
  </Popover>;

  return <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
    <h4>
      <EventIcon className={styles.icon} report={report} />
      {report.serial_number && <span>{report.serial_number}</span>}
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
