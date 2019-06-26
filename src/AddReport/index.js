import React, { memo, useState, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';

import EventTypeListItem from '../EventTypeListItem';

import styles from './styles.module.scss';

const AddReport = (props) => {
  const { eventsByCategory, map, showLabel, showIcon, container, title, onSaveSuccess, onSaveError } = props;
  const [selectedCategory, selectCategory] = useState(eventsByCategory[0].value);

  const targetRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);

  const startEditNewReport = (reportType) => {
    const newReport = createNewReportForEventType(reportType);
    openModalForReport(newReport, map, onSaveSuccess, onSaveError);
    setPopoverState(false);
  };

  const createListItem = (reportType) => {
    return <li key={reportType.id}>
      <button type='button' onClick={() => startEditNewReport(reportType)}>
        <EventTypeListItem {...reportType} />
      </button>
    </li>;
  };

  const categoryList = <ul className={styles.categoryMenu}>
    {eventsByCategory.map(({ value, display }) =>
      <li key={value}>
        <button type='button' className={value === selectedCategory ? styles.activeCategory : ''} onClick={() => selectCategory(value)}>{display}</button>
      </li>
    )}
  </ul>;

  const reportTypeList = <ul className={styles.reportTypeMenu}>
    {eventsByCategory
      .find(({ value: c }) => c === selectedCategory).types
      .map(createListItem)}
  </ul>;

  const AddReportPopover = <Popover className={styles.popover} placement='auto' title={<h4>{title}</h4>}>
    {categoryList}
    {reportTypeList}
  </Popover>;

  return <Fragment>
    <button title={title} className={styles.addReport} ref={targetRef} type='button' onClick={() => setPopoverState(true)}>
      {showIcon && <AddButtonIcon />}
      {showLabel && <span>{title}</span>}
    </button>
    <Overlay shouldUpdatePosition={true} show={popoverOpen} rootClose onHide={() => setPopoverState(false)} container={container.current} target={targetRef.current}>
      {() => AddReportPopover}
    </Overlay>
  </Fragment>;
};

const mapStateToProps = (state) => ({
  eventsByCategory: getUserCreatableEventTypesByCategory(state),
});
export default connect(mapStateToProps, null)(memo(AddReport));

AddReport.defaultProps = {
  showIcon: true,
  showLabel: true,
  title: 'Add Report',
  onSaveSuccess() {

  },
  onSaveError() {

  },
};

AddReport.propTypes = {
  container: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
  title: PropTypes.string,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};