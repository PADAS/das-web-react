import React, { forwardRef, memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import CustomPropTypes from '../proptypes';
import { useFeatureFlag } from '../hooks';
import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import { trackEvent } from '../utils/analytics';
import { openModalForPatrol, generatePseudoReportCategoryForPatrolTypes, createNewPatrolForPatrolType } from '../utils/patrols';

import EventTypeListItem from '../EventTypeListItem';

import { FEATURE_FLAGS } from '../constants';

import styles from './styles.module.scss';

const AddReport = (props) => {
  const { analyticsMetadata, className = '', relationshipButtonDisabled, hidePatrols, patrolTypes, isPatrolReport, reportData, eventsByCategory, map, popoverPlacement,
    showLabel, showIcon, title, onSaveSuccess, onSaveError, clickSideEffect } = props;

  const [selectedCategory, selectCategory] = useState(null);

  const patrolsEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);

  const targetRef = useRef(null);
  const containerRef = useRef(null);
  const [popoverOpen, setPopoverState] = useState(false);
  const placement = popoverPlacement || 'auto';

  const displayCategories = useMemo(() => {
    if (hidePatrols || !patrolsEnabled || !patrolTypes.length) return eventsByCategory;

    const sortedPatrolTypes = patrolTypes
      .filter((type) =>
        type.hasOwnProperty('is_active')
          ? !!type.is_active 
          : true
      )
      .sort((item1, item2) => {
        const first = typeof item1.ordernum === 'number' ? item1.ordernum : 1000;
        const second = typeof item2.ordernum === 'number' ? item2.ordernum : 1000;

        return first - second;
      });

    return [
      generatePseudoReportCategoryForPatrolTypes(sortedPatrolTypes),
      ...eventsByCategory,
    ];
  }, [eventsByCategory, hidePatrols, patrolTypes, patrolsEnabled]);

  const hasEventCategories = !!displayCategories.length;

  const onButtonClick = useCallback((e) => {
    if (clickSideEffect) {
      clickSideEffect(e);
    }
    setPopoverState(!popoverOpen);
    trackEvent(analyticsMetadata.category, `Click 'Add Report' button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`);
  }, [analyticsMetadata.category, analyticsMetadata.location, clickSideEffect, popoverOpen]);

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
      selectCategory(displayCategories[0].value);
    }
  }, [hasEventCategories, displayCategories, selectedCategory]);

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
    trackEvent(analyticsMetadata.category, `Click Add '${reportType.display}' Report button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`);

    /* PATROL_SCAFFOLD */
    if (patrolsEnabled) {
      const isPatrol = reportType.category.value === 'patrols';

      if (isPatrol) {
        openModalForPatrol(createNewPatrolForPatrolType(reportType, reportData));
        return;
      }

    }
    /* END PATROL_SCAFFOLD */

    const newReport = createNewReportForEventType(reportType, reportData);
    
    openModalForReport(newReport, map, { onSaveSuccess, onSaveError, relationshipButtonDisabled, hidePatrols, isPatrolReport  });
    setPopoverState(false);
  };

  const onCategoryClick = (category) => {
    selectCategory(category);
    trackEvent(analyticsMetadata.category, `Click '${category}' Category option${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`);
  };


  const CategoryList = (props) => {
    const { eventsByCategory, selectedCategory, onCategoryClick } = props;

    return <ul className={styles.categoryMenu}>
      {eventsByCategory
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
      <CategoryList eventsByCategory={displayCategories} selectedCategory={selectedCategory} onCategoryClick={onCategoryClick} />
      <ReportTypeList eventsByCategory={displayCategories} selectedCategory={selectedCategory} />
    </Popover.Content>
  </Popover>
  );

  return <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={className}>
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

const mapStateToProps = (state, ownProps) => ({
  eventsByCategory: getUserCreatableEventTypesByCategory(state, ownProps),
  patrolTypes: state.data.patrolTypes,
});
export default connect(mapStateToProps, null)(memo(AddReport));

AddReport.defaultProps = {
  analyticsMetadata: {
    category: 'Feed',
    location: null,
  },
  relationshipButtonDisabled: false,
  showIcon: true,
  showLabel: true,
  title: 'Add',
  onSaveSuccess() {

  },
  onSaveError() {

  },
  reportData: {},
};

AddReport.propTypes = {
  analyticsMetaData: CustomPropTypes.analyticsMetadata,
  relationshipButtonDisabled: PropTypes.bool,
  hidePatrols: PropTypes.bool,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
  title: PropTypes.string,
  reportData: PropTypes.object,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};