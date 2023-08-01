import React, { memo, useCallback, useMemo, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { connect } from 'react-redux';
import { showToast } from '../utils/toast';
import { toast } from 'react-toastify';
import { SpinLoader } from 'react-css-loaders';
import PropTypes from 'prop-types';

import ContextMenu from '../ContextMenu';
import { isReportActive } from '../utils/events';
import { updateEvent as updateEventDuck } from '../ducks/events';

import styles from './styles.module.scss';

const { Item } = Dropdown;
const { TYPE: { INFO, ERROR } } = toast;

const showNotification = (message, type = INFO) => showToast({
  message,
  toastConfig: {
    type,
    autoClose: 2000,
    hideProgressBar: true,
  }
});

const EventItemContextMenu = ({ report, updateEvent, className, children }) => {
  const isActive = useMemo(() => isReportActive(report), [report]);
  const title = useMemo(() => isActive ? 'Resolve': 'Reopen', [isActive]);
  const [isLoading, setIsLoading] = useState(false);

  const updateReportState = useCallback(async () => {
    try {
      setIsLoading(true);
      await updateEvent({ id: report.id, state: isActive ? 'resolved' : 'active' });

      showNotification(isActive ? `#${report.serial_number} Resolved` : `#${report.serial_number} Active`,);
    } catch (e) {
      const errorMessage = isActive ? `#${report.serial_number} still active` : `#${report.serial_number} still closed`;

      showNotification(`${errorMessage}, something went wrong`, ERROR);
    } finally {
      setIsLoading(false);
    }
  },
  [isActive, report, updateEvent]);

  return <ContextMenu className={className} disabled={isLoading} options={
    <Item onClick={updateReportState}>{title} #{report.serial_number}</Item>
  }>
    { isLoading && <div className={styles.loading}>
      <SpinLoader />
    </div>}
    {children}
  </ContextMenu>;
};

EventItemContextMenu.defaultProps = {
  className: ''
};

EventItemContextMenu.propTypes = {
  report: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
  updateEvent: PropTypes.func,
  className: PropTypes.string
};

export default memo(connect(undefined, {
  updateEvent: (event) => updateEventDuck(event)
})(EventItemContextMenu));
