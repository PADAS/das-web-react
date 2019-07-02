import React, { memo } from 'react';
import PropTypes from 'prop-types';

import DateTime from '../DateTime';
import EventIcon from '../EventIcon';
import LocationJumpButton from '../LocationJumpButton';

import { getCoordinatesForEvent } from '../utils/events';
import { displayTitleForEventByEventType } from '../utils/events';

import styles from './styles.module.scss';

const ReportListItem = (props) => {
  const { map, report, onTitleClick, onIconClick, showDate, showJumpButton, className, key, ...rest } = props;
  const coordinates = getCoordinatesForEvent(report);

  const iconClickHandler = onIconClick || onTitleClick;

  return <li className={`${styles.listItem} ${styles[`priority-${report.priority}`]} ${className}`} key={key} {...rest}>
    <button type='button' className={styles.icon} onClick={() => iconClickHandler(report)}><EventIcon iconId={report.icon_id} /></button>
    <span className={styles.serialNumber}>{report.serial_number}</span>
    <button type='button' className={styles.title} onClick={() => onTitleClick(report)}>{displayTitleForEventByEventType(report)}</button>
    <span className={styles.date}>
      <DateTime date={report.updated_at || report.time} />
      {report.state === 'resolved' && <small className={styles.resolved}>resolved</small>}
    </span>
    {coordinates && showJumpButton &&
      <div className={styles.jump}>
        <LocationJumpButton coordinates={coordinates} map={map} />
      </div>
    }
  </li>;
};

export default memo(ReportListItem);

ReportListItem.defaultProps = {
  showJumpButton: true,
  showDate: true,
};

ReportListItem.propTypes = {
  key: PropTypes.string,
  report: PropTypes.object.isRequired,
  map: PropTypes.object,
  onTitleClick: PropTypes.func,
  onIconClick: PropTypes.func,
  showJumpButton: PropTypes.bool,
  showDate: PropTypes.bool,
};