import React, { forwardRef, memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import CustomPropTypes from '../proptypes';
import { useFeatureFlag, usePermissions } from '../hooks';
import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import { trackEvent } from '../utils/analytics';
import { openModalForPatrol, generatePseudoReportCategoryForPatrolTypes, createNewPatrolForPatrolType } from '../utils/patrols';

import EventTypeListItem from '../EventTypeListItem';

import { FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS } from '../constants';

import styles from './styles.module.scss';

const TAB_KEYS = {
  REPORTS: 'reports',
  PATROLS: 'patrols',
};

const CategoryList = (props) => {
  const { eventsByCategory, selectedCategory, onCategoryClick } = props;

  return <ul className={styles.categoryMenu}>
    {eventsByCategory
      .map((category) => {
        const { value, display } = category;
        return <li key={value}>
          <button type='button' className={value === selectedCategory.value ? styles.activeCategory : ''}
            onClick={() => onCategoryClick(category)}>{display}</button>
        </li>;
      }
      )}
  </ul>;
};

const ReportTypeList = (props) => {
  const { reportTypes, onClickReportType } = props;

  const createListItem = (reportType) => {
    return <li key={reportType.id}>
      <button type='button' onClick={() => onClickReportType(reportType)}>
        <EventTypeListItem {...reportType} />
      </button>
    </li>;
  };

  return !!reportTypes.length && <ul className={styles.reportTypeMenu}>
    {reportTypes.map(createListItem)}
  </ul>;
};

const MemoizedReportTypeList = memo(ReportTypeList);
const MemoizedCategoryList = memo(CategoryList);

const AddReportPopover = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { eventsByCategory, selectedCategory, onCategoryClick, onClickReportType, patrolsEnabled } = props;

  const [activeTab, setActiveTab] = useState(TAB_KEYS.REPORTS);


  return <Popover {...props} ref={ref} className={styles.popover}> 
    <Popover.Content>
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className={styles.tabBar}>
        <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Add Report">
          <MemoizedCategoryList eventsByCategory={eventsByCategory} selectedCategory={selectedCategory} onCategoryClick={onCategoryClick} />
          <MemoizedReportTypeList reportTypes={selectedCategory.types} onClickReportType={onClickReportType} />
        </Tab>
        {patrolsEnabled && <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Add Patrol">
        </Tab>}
      </Tabs>
    </Popover.Content>
  </Popover>;
});

const MemoizedAddReportPopover = memo(AddReportPopover);


const AddReport = (props) => {
  const { analyticsMetadata, className = '', formProps, patrolTypes, reportData, eventsByCategory,
    map, popoverPlacement = 'auto', showLabel, showIcon, title, clickSideEffect } = props;

  const { hidePatrols } = formProps;

  const [selectedCategory, selectCategory] = useState(null);

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolWritePermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.CREATE);

  

  const patrolsEnabled = !!patrolFlagEnabled
    && !!hasPatrolWritePermissions 
    && !!patrolTypes.length 
    && !hidePatrols;

  const targetRef = useRef(null);
  const containerRef = useRef(null);

  const [popoverOpen, setPopoverState] = useState(false);

  const sortedPatrolTypes = useMemo(() => patrolTypes
    .filter((type) =>
      type.hasOwnProperty('is_active')
        ? !!type.is_active 
        : true
    )
    .sort((item1, item2) => {
      const first = typeof item1.ordernum === 'number' ? item1.ordernum : 1000;
      const second = typeof item2.ordernum === 'number' ? item2.ordernum : 1000;

      return first - second;
    })
  , [patrolTypes]);

  const hasEventCategories = !!eventsByCategory.length;

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
      selectCategory(eventsByCategory[0]);
    }
  }, [hasEventCategories, selectedCategory, eventsByCategory]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverState(false);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [popoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEditNewReport = useCallback((reportType) => {
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
    
    openModalForReport(newReport, map, formProps);
    setPopoverState(false);
  }, [analyticsMetadata.category, analyticsMetadata.location, formProps, map, patrolsEnabled, reportData]);

  const onCategoryClick = useCallback((category) => {
    selectCategory(category);
    trackEvent(analyticsMetadata.category, `Click '${category}' Category option${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`);
  }, [analyticsMetadata.category, analyticsMetadata.location]);

  return hasEventCategories && <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={className}>
    <button title={title} className={styles.addReport} ref={targetRef}
      type='button' onClick={onButtonClick}>
      {showIcon && <AddButtonIcon />}
      {showLabel && <span>{title}</span>}
    </button>
    <Overlay show={popoverOpen} container={containerRef.current} target={targetRef.current} placement={popoverPlacement}>
      <MemoizedAddReportPopover eventsByCategory={eventsByCategory} selectedCategory={selectedCategory}
        onCategoryClick={onCategoryClick} onClickReportType={startEditNewReport} patrolsEnabled={patrolsEnabled} />
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
  showIcon: true,
  showLabel: true,
  title: 'Add',
  formProps: {
    hidePatrols: false,
    isPatrolReport: false,
    relationshipButtonDisabled: false,
    onSaveSuccess() {

    },
    onSaveError() {
    },
  },
  reportData: {},
};

AddReport.propTypes = {
  analyticsMetaData: CustomPropTypes.analyticsMetadata,
  map: PropTypes.object.isRequired,
  showLabel: PropTypes.bool,
  showIcon: PropTypes.bool,
  title: PropTypes.string,
  patrolTypes: PropTypes.array,
  popoverPlacement: PropTypes.string,
  reportData: PropTypes.object,
  formProps: PropTypes.shape({
    relationshipButtonDisabled: PropTypes.bool,
    onSaveSuccess: PropTypes.func,
    onSaveError: PropTypes.func,
    hidePatrols: PropTypes.bool,
    isPatrolReport: PropTypes.bool,
  }),
};