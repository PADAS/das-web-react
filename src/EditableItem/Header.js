import React, { forwardRef, memo, useCallback, useContext, useMemo, useState, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from '../TimeAgo';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import { FormDataContext } from './context';

import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import DateTime from '../DateTime';

// import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const EditableItemHeader = (props) => {
  const { /* addModal,  */children, priority, icon:Icon, menuContent: MenuContent, title:titleProp, onTitleChange, /* onAddToNewIncident, onAddToExistingIncident */ } = props;

  const data = useContext(FormDataContext);
  
  const menuRef = useRef(null);
  const historyRef = useRef(null);
  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverState] = useState(false);
  const [editingTitle, setTitleEditState] = useState(false);


  const startTitleEdit = useCallback(() => {
    setTitleEditState(true);
  }, []);

  const cancelTitleEdit = useCallback(() => {
    setTitleEditState(false);
  }, []);

  const onSaveTitle = useCallback((value) => {
    onTitleChange(value);
    setTitleEditState(false);
  }, [onTitleChange]);

  const title = useMemo(() => {
    return titleProp || data.title;
  }, [data.title, titleProp]);

  const updateTime = useMemo(() => {
    return data.updated_at || data.created_at || data.updates[data.updates.length - 1].time;
  }, [data.updated_at, data.created_at, data.updates]);

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
    // trackEvent(eventOrIncidentReport, `${headerPopoverOpen?'Close':'Open'} Hamburger Menu`);
  };

  const onHistoryClick = () => {
    setHistoryPopoverState(!historyPopoverOpen);
    // trackEvent(eventOrIncidentReport, `${historyPopoverOpen?'Close':'Open'} Report History`);
  };

  const HistoryLink = data.updates && <Fragment>
    <span ref={historyRef} onClick={onHistoryClick} className={styles.history}>
      {data.updates.length > 1 ? 'Updated' : 'Created'} <TimeAgo date={updateTime}/>
    </span>
  </Fragment>;

  const HistoryPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} placement='auto' className={styles.historyPopover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>History</Popover.Title>
    <Popover.Content>
      <ul>
        {data.updates && data.updates.map((update) =>
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

  return <div className={`${styles.formHeader} ${styles[`priority-${priority}`]}`} onKeyDown={handleEscapePress}>
    <h4>
      {!!Icon &&
        <span className={styles.headerIcon}>
          {Icon}
        </span>
      }
      {data.serial_number && <span>{data.serial_number}</span>}
      <InlineEditable editing={editingTitle} onClick={startTitleEdit} onEsc={cancelTitleEdit} onCancel={cancelTitleEdit} value={title} onSave={onSaveTitle} />
      {children}
      <div className={styles.headerDetails}>
        {!!MenuContent && <Fragment>
          <HamburgerMenuIcon ref={menuRef} isOpen={headerPopoverOpen} onClick={onHamburgerMenuIconClick} />
          <Overlay show={headerPopoverOpen} target={menuRef.current} shouldUpdatePosition={true} rootClose
            onHide={() => setHeaderPopoverState(false)} placement='auto' trigger='click'>
            {MenuContent}
          </Overlay>
        </Fragment>
        }
        {HistoryLink}
        <Overlay show={historyPopoverOpen} target={historyRef.current} shouldUpdatePosition={true} rootClose
          onHide={() => setHistoryPopoverState(false)} placement='right' trigger='click'>
          <HistoryPopover />
        </Overlay>
        {data.state === 'resolved' && <small>resolved</small>}
      </div>
    </h4>
  </div>;
};

export default memo(EditableItemHeader);

EditableItemHeader.propTypes = {
  data: PropTypes.object,
  title: PropTypes.string,
  onTitleChange: PropTypes.func.isRequired,
  priority: PropTypes.number,
  Icon: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]),
  MenuContent: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]),
};

