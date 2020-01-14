import React, { forwardRef, memo, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import { trackEvent } from '../utils/analytics';

import EventTypeListItem from '../EventTypeListItem';

import styles from './styles.module.scss';

const AddReport = (props) => {
  const { relationshipButtonDisabled, reportData, eventsByCategory, map, popoverPlacement,
    showLabel, showIcon, title, onSaveSuccess, onSaveError } = props;
  const [selectedCategory, selectCategory] = useState(eventsByCategory[0].value);

  const targetRef = useRef(null);
  const containerRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);
  const placement = popoverPlacement || 'auto';

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverState(false);
      }
    };
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setPopoverState(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEditNewReport = (reportType) => {
    trackEvent('Feed', `Click Add '${reportType.display}' Report button`);
    const newReport = {
      ...createNewReportForEventType(reportType),
      ...reportData,
    };
    openModalForReport(newReport, map, { onSaveSuccess, onSaveError, relationshipButtonDisabled });
    setPopoverState(false);
  };

  const createListItem = (reportType) => {
    return <li key={reportType.id}>
      <button type='button' onClick={() => startEditNewReport(reportType)}>
        <EventTypeListItem {...reportType} />
      </button>
    </li>;
  };


  const onButtonClick = () => {
    setPopoverState(!popoverOpen);
    trackEvent('Feed', 'Click \'Add Report\' button');
  };

  const onCategoryClick = (category) => {
    selectCategory(category);
    trackEvent('Feed', `Click '${category}' Category option`);
  };

  const categoryList = <ul className={styles.categoryMenu}>
    {eventsByCategory.map(({ value, display }) =>
      <li key={value}>
        <button type='button' className={value === selectedCategory ? styles.activeCategory : ''}
          onClick={() => onCategoryClick(value)}>{display}</button>
      </li>
    )}
  </ul>;

  const reportTypeList = <ul className={styles.reportTypeMenu}>
    {eventsByCategory
      .find(({ value: c }) => c === selectedCategory).types
      .map(createListItem)}
  </ul>;

  const AddReportPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} className={styles.popover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>{title}</Popover.Title>
    <Popover.Content>
      {categoryList}
      {reportTypeList}
    </Popover.Content>
  </Popover>
  );

  return <div ref={containerRef}>
    <button title={title} className={styles.addReport} ref={targetRef}
      type='button' onClick={onButtonClick}>
      {showIcon && <AddButtonIcon />}
      {showLabel && <span>{title}</span>}
    </button>
    <Overlay show={popoverOpen} container={containerRef.current} target={targetRef.current} placement={placement}>
      <AddReportPopover />
    </Overlay>
  </div>;
};

const mapStateToProps = (state) => ({
  eventsByCategory: getUserCreatableEventTypesByCategory(state),
});
export default connect(mapStateToProps, null)(memo(AddReport));

AddReport.defaultProps = {
  relationshipButtonDisabled: false,
  showIcon: true,
  showLabel: true,
  title: 'Add Report',
  onSaveSuccess() {

  },
  onSaveError() {

  },
  reportData: {},
};

AddReport.propTypes = {
  relationshipButtonDisabled: PropTypes.bool,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
  title: PropTypes.string,
  reportData: PropTypes.object,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};