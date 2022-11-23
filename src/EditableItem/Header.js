import React, { forwardRef, memo, useCallback, useContext, useMemo, useState, useRef } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { analyticsMetadata } from '../proptypes';
import { BREAKPOINTS } from '../constants';
import { FormDataContext } from './context';
import { trackEvent } from '../utils/analytics';
import { useMatchMedia } from '../hooks';

import DateTime from '../DateTime';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import InlineEditable from '../InlineEditable';
import TimeAgo from '../TimeAgo';

import styles from './styles.module.scss';

const EditableItemHeader = ({
  afterMenuToggle,
  analyticsMetadata,
  children,
  icon: Icon,
  maxTitleLength,
  menuContent: MenuContent,
  onTitleChange,
  priority,
  readonly,
  title: titleProp,
}) => {
  const data = useContext(FormDataContext);

  const menuRef = useRef(null);
  const historyRef = useRef(null);

  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverState] = useState(false);
  const [editingTitle, setTitleEditState] = useState(false);

  const isExtraLargeLayout = useMatchMedia(BREAKPOINTS.screenIsExtraLargeWidth);

  const popoverPlacement = isExtraLargeLayout ? 'auto' : 'left';

  const startTitleEdit = useCallback(() => setTitleEditState(true), []);

  const cancelTitleEdit = useCallback(() => setTitleEditState(false), []);

  const onSaveTitle = useCallback((value) => {
    onTitleChange(value);
    setTitleEditState(false);
  }, [onTitleChange]);

  const title = useMemo(() => titleProp || data.title, [data.title, titleProp]);

  const updateTime = useMemo(() => {
    if (data.updates?.length) {
      const [latestUpdate] = data.updates;
      return latestUpdate.time;
    }

    return data.updated_at || data.created_at;
  }, [data.updated_at, data.created_at, data.updates]);

  const handleEscapePress = (event) => {
    if (event.key === 'Escape' && (headerPopoverOpen || historyPopoverOpen)) {
      event.preventDefault();
      event.stopPropagation();
      setHeaderPopoverState(false);
      setHistoryPopoverState(false);
    }
  };

  const onHamburgerMenuIconClick = () => {
    setHeaderPopoverState(!headerPopoverOpen);
    afterMenuToggle && afterMenuToggle(!headerPopoverOpen);
    !!analyticsMetadata && trackEvent(
      analyticsMetadata.category,
      `${headerPopoverOpen?'Close':'Open'} Hamburger Menu${!!analyticsMetadata.location ? ` for ${analyticsMetadata.location}` : ''}`
    );
  };

  const onHistoryClick = () => {
    setHistoryPopoverState(!historyPopoverOpen);
    !!analyticsMetadata && trackEvent(
      analyticsMetadata.category,
      `${historyPopoverOpen?'Close':'Open'} History${!!analyticsMetadata.location ? ` for ${analyticsMetadata.location}` : ''}`
    );
  };

  const HistoryLink = data.updates && <>
    <span ref={historyRef} onClick={onHistoryClick} className={styles.history}>
      {data.updates.length > 1 ? 'Updated' : 'Created'} <TimeAgo date={updateTime}/>
    </span>
  </>;

  // eslint-disable-next-line react/display-name
  const HistoryPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} className={styles.historyPopover}>
    <Popover.Header>History</Popover.Header>

    <Popover.Body>
      <ul>
        {data.updates && data.updates.map((update) =>
          <li className={styles.listItem} key={update.time}>
            <div className={styles.historyItem}>
              <div className={styles.historyDetails}>
                <div className={styles.historyMessage}>{update.message.replace(/ by [ \w+\b]*$/g, '')}</div>
                {update?.user?.first_name && <div className={styles.historyUser}>
                  {`${update.user.first_name} ${update.user.last_name}`.trim()}
                </div>}
              </div>

              <DateTime className={styles.historyDate} date={update.time}/>
            </div>
          </li>
        )}
      </ul>
    </Popover.Body>
  </Popover>);

  return <div className={`${styles.formHeader} ${styles[`priority-${priority}`]} ${readonly ? styles.readonly : ''}`} onKeyDown={handleEscapePress}>
    <h4>
      {!!Icon && <span className={styles.headerIcon}>{Icon}</span>}

      {data.serial_number && <span>{data.serial_number}</span>}

      <InlineEditable
        editing={editingTitle}
        onClick={startTitleEdit}
        onChange={onTitleChange}
        onEsc={cancelTitleEdit}
        onCancel={cancelTitleEdit}
        value={title}
        onSave={onSaveTitle}
        maxLength={maxTitleLength}
      />

      {children}

      <div className={styles.headerDetails}>
        {!!MenuContent && <>
          <HamburgerMenuIcon ref={menuRef} isOpen={headerPopoverOpen} onClick={onHamburgerMenuIconClick} />
          <Overlay
            show={headerPopoverOpen}
            target={menuRef.current}
            shouldUpdatePosition={true}
            rootClose
            onHide={() => setHeaderPopoverState(false)}
            placement={popoverPlacement}
            trigger='click'
          >
            {MenuContent}
          </Overlay>
        </>
        }

        {HistoryLink}

        <Overlay
          show={historyPopoverOpen}
          target={historyRef.current}
          shouldUpdatePosition={true}
          rootClose
          onHide={() => setHistoryPopoverState(false)}
          placement={popoverPlacement}
          trigger='click'
        >
          <HistoryPopover />
        </Overlay>

        {data.state === 'resolved' && <small>resolved</small>}
      </div>
    </h4>
  </div>;
};

EditableItemHeader.propTypes = {
  afterMenuToggle: PropTypes.func,
  analyticsMetadata,
  data: PropTypes.object,
  Icon: PropTypes.oneOfType([PropTypes.element, PropTypes.node]),
  maxTitleLength: PropTypes.number,
  MenuContent: PropTypes.oneOfType([PropTypes.element, PropTypes.node]),
  onTitleChange: PropTypes.func.isRequired,
  priority: PropTypes.number,
  title: PropTypes.string,
};

export default memo(EditableItemHeader);
