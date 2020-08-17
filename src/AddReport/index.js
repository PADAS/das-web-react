import React, { forwardRef, memo, useCallback, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import { trackEvent } from '../utils/analytics';
import { openModalForPatrol } from '../utils/patrols';
import { evaluateFeatureFlag } from '../utils/feature-flags';

import EventTypeListItem from '../EventTypeListItem';

import { FEATURE_FLAGS } from '../constants';

import styles from './styles.module.scss';

const AddReport = (props) => {
  const { relationshipButtonDisabled, reportData, eventsByCategory, map, popoverPlacement,
    showLabel, showIcon, title, onSaveSuccess, onSaveError, clickSideEffect, patrols } = props;
  const hasEventCategories = !!eventsByCategory.length;
  const [selectedCategory, selectCategory] = useState(null);

  const targetRef = useRef(null);
  const containerRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);
  const placement = popoverPlacement || 'auto';

  const onButtonClick = useCallback((e) => {
    if (clickSideEffect) {
      clickSideEffect(e);
    }
    setPopoverState(!popoverOpen);
    trackEvent('Feed', 'Click \'Add Report\' button');
  }, [clickSideEffect, popoverOpen]);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    if (key === 'Escape' && popoverOpen) {
      event.preventDefault();
      event.stopPropagation();
      setPopoverState(false);
    }
  }, [popoverOpen]);

  useEffect(() => {
    if (hasEventCategories && !selectedCategory) {
      selectCategory(eventsByCategory[0].value);
    }
  }, [hasEventCategories, eventsByCategory, selectedCategory]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverState(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [popoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEditNewReport = (reportType) => {
    trackEvent('Feed', `Click Add '${reportType.display}' Report button`);

    /* PATROL_SCAFFOLD */
    if (evaluateFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT)) {
      const isPatrol = !!reportType.value.match(/(patrol)[1-9]/g);

      if (isPatrol) {
        console.log('the patrols', patrols);
        openModalForPatrol(patrols.results[0], map);
        console.log('you clicked a patrol type!');
        return;
      }
    }
    /* END PATROL_SCAFFOLD */

    const newReport = {
      ...createNewReportForEventType(reportType),
      ...reportData,
    };
    openModalForReport(newReport, map, { onSaveSuccess, onSaveError, relationshipButtonDisabled });
    setPopoverState(false);
  };

  const onCategoryClick = (category) => {
    selectCategory(category);
    trackEvent('Feed', `Click '${category}' Category option`);
  };


  const CategoryList = (props) => {
    const { eventsByCategory, selectedCategory, onCategoryClick } = props;

    return <ul className={styles.categoryMenu}>
      {eventsByCategory
        .sort((cat, cat2) => {
          const first = typeof cat.ordernum === 'number' ? cat.ordernum : 0;
          const second = typeof cat2.ordernum === 'number' ? cat.ordernum : 0;

          return second - first;
        })
        .map(({ value, display }) =>
          <li key={value}>
            <button type='button' className={value === selectedCategory ? styles.activeCategory : ''}
              onClick={() => onCategoryClick(value)}>{display}</button>
          </li>
        )}
    </ul>;
  };

  const ReportTypeList = (props) => {
    const { eventsByCategory, selectedCategory } = props;

    const createListItem = (reportType) => {
      return <li key={reportType.id}>
        <button type='button' onClick={() => startEditNewReport(reportType)}>
          <EventTypeListItem {...reportType} />
        </button>
      </li>;
    };

    return hasEventCategories && <ul className={styles.reportTypeMenu}>
      {eventsByCategory.find(({ value: c }) => c === selectedCategory).types.map(createListItem)}
    </ul>;
  };

  const AddReportPopover = forwardRef((props, ref) => <Popover {...props} ref={ref} className={styles.popover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>{title}</Popover.Title>
    <Popover.Content>
      <CategoryList eventsByCategory={eventsByCategory} selectedCategory={selectedCategory} onCategoryClick={onCategoryClick} />
      <ReportTypeList eventsByCategory={eventsByCategory} selectedCategory={selectedCategory} />
    </Popover.Content>
  </Popover>
  );

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown}>
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
  patrols: state.data.patrols,
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