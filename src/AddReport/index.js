import React, { memo, useState, useRef, Fragment } from 'react';
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
  const { relationshipButtonDisabled, reportData, eventsByCategory, map, 
    showLabel, showIcon, container, title, onSaveSuccess, onSaveError } = props;
  const [selectedCategory, selectCategory] = useState(eventsByCategory[0].value);

  const targetRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);

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
    setPopoverState(true);
    trackEvent('Feed', "Click 'Add Report' button");
  };

  const onCategoryClick = (category) => {
    selectCategory(category)
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

  const AddReportPopover = <Popover className={styles.popover} placement='auto'>
    <Popover.Title>{title}</Popover.Title>
    <Popover.Content>
      {categoryList}
      {reportTypeList}
    </Popover.Content>
  </Popover>;

  return <Fragment>
    <button title={title} className={styles.addReport} ref={targetRef} 
      type='button' onClick={onButtonClick}>
      {showIcon && <AddButtonIcon />}
      {showLabel && <span>{title}</span>}
    </button>
    <Overlay shouldUpdatePosition={true} show={popoverOpen} rootClose 
      placement='auto' onHide={() => setPopoverState(false)} 
      container={container.current} target={targetRef.current}>
      {() => AddReportPopover}
    </Overlay>
  </Fragment>;
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
  container: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
  title: PropTypes.string,
  reportData: PropTypes.object,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};