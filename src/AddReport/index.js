import React, { memo, useState, useRef, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Popover, Overlay } from 'react-bootstrap';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { mapReportTypesToCategories } from '../utils/event-types';

import EventTypeListItem from '../EventTypeListItem';

import styles from './styles.module.scss';

const AddReport = (props) => {
  const { eventTypes, map, showLabel, showIcon, container } = props;
  const itemsGroupedByCategory = mapReportTypesToCategories(eventTypes);
  const [selectedCategory, selectCategory] = useState(itemsGroupedByCategory[0].category);

  const targetRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);

  const startEditNewReport = (reportType) => {
    const newReport = createNewReportForEventType(reportType);
    openModalForReport(newReport, map);
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
    {itemsGroupedByCategory.map(({ category, display }) =>
      <li key={category}>
        <button className={category === selectedCategory ? styles.activeCategory : ''} onClick={() => selectCategory(category)}>{display}</button>
      </li>
    )}
  </ul>;

  const reportTypeList = <ul className={styles.reportTypeMenu}>
    {itemsGroupedByCategory
      .find(({ category: c }) => c === selectedCategory).types
      .map(createListItem)}
  </ul>;

  const AddReportPopover = <Popover className={styles.popover} placement='auto' title={<h4>Add Report</h4>}>
    {categoryList}
    {reportTypeList}
  </Popover>;

  return <Fragment>
    <button title='Add Report' className={styles.addReport} ref={targetRef} type='button' onClick={() => setPopoverState(true)}>
      {showIcon && <AddButtonIcon />}
      {showLabel && <span>Add Report</span>}
    </button>
    <Overlay shouldUpdatePosition={true} show={popoverOpen} rootClose onHide={() => setPopoverState(false)} container={container.current} target={targetRef.current}>
      {() => AddReportPopover}
    </Overlay>
  </Fragment>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });
export default connect(mapStateToProps, null)(memo(AddReport));

AddReport.defaultProps = {
  showIcon: true,
  showLabel: true,
};

AddReport.propTypes = {
  container: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
};