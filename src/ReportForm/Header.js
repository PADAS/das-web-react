import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import PriorityPicker from '../PriorityPicker';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

import { displayTitleForEventByEventType } from '../utils/events';

import styles from './styles.module.scss';

const calcClassNameForPriority = (priority) => {
  if (priority === 300) return 'highPriority';
  if (priority === 200) return 'mediumPriority';
  if (priority === 100) return 'lowPriority';
  return 'noPriority';
};

const ReportFormHeader = (props) => {
  const { report, eventTypes, onReportTitleChange, onPrioritySelect } = props;
  const reportTitle = displayTitleForEventByEventType(report, eventTypes);

  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);

  const ReportHeaderPopover = <Popover placement='auto' className={styles.popover}>
    <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
  </Popover>;


  return <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
    <h4>
      <EventIcon className={styles.icon} iconId={report.icon_id} />
      {report.serial_number && `${report.serial_number}:`}
      <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      <OverlayTrigger shouldUpdatePosition={true} onExiting={() => setHeaderPopoverState(false)} placement='auto' rootClose trigger='click' overlay={ReportHeaderPopover}>
        <HamburgerMenuIcon isOpen={headerPopoverOpen} onClick={() => setHeaderPopoverState(!headerPopoverOpen)} />
      </OverlayTrigger>
    </h4>
  </div>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(memo(ReportFormHeader));

ReportFormHeader.propTypes = {
  report: PropTypes.object.isRequired,
  onReportTitleChange: PropTypes.func.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
};