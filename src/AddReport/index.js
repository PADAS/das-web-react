import React, { Fragment, forwardRef, memo, createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';

import CustomPropTypes from '../proptypes';
import { useFeatureFlag, usePermissions } from '../hooks';
import { setActiveAddReportTab } from '../ducks/add-report-tab';
import { openModalForReport, createNewReportForEventType } from '../utils/events';
import { getUserCreatableEventTypesByCategory } from '../selectors';
import { trackEvent } from '../utils/analytics';
import { generatePseudoReportCategoryForPatrolTypes, openModalForPatrol, createNewPatrolForPatrolType } from '../utils/patrols';

import SearchBar from '../SearchBar';
import EventTypeListItem from '../EventTypeListItem';

import { FEATURE_FLAGS, PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../constants';

import styles from './styles.module.scss';


const ReportTypesContext = createContext(null);
const PatrolTypesContext = createContext(null);


const ReportTypeList = (props) => {
  const { categories, filter = '', onClickReportType } = props;

  const filterText = filter.toLowerCase();

  const filteredCategories = categories
    .reduce((accumulator, category) => {
      
      if (!category.types.length) return accumulator;

      if (category.display.toLowerCase().includes(filterText)) {
        return [
          ...accumulator,
          category,
        ];
      }

      const filteredTypes = category.types.filter(type => type.display.toLowerCase().includes(filterText));

      if (!filteredTypes.length) return accumulator;

      return [
        ...accumulator,
        {
          ...category,
          types: filteredTypes,
        }
      ];

    }, []);

  const createList = useCallback((category, showTitle) => 
    <Fragment>
      {showTitle && <h4 className={styles.categoryTitle}>{category.display}</h4>}
      <ul key={category.value} className={styles.reportTypeMenu}>
        {category.types.map(type => <li key={type.id}>
          <button type='button' onClick={() => onClickReportType(type)}>
            <EventTypeListItem {...type} />
          </button>
        </li>)}
      </ul>
    </Fragment>
  , [onClickReportType]);

  return <div className={styles.reportTypeContainer}>
    {filteredCategories
      .map(category => createList(category, categories.length > 1))}
  </div>;
};

const AddReportPopover = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { onClickReportType, activeAddReportTab, setActiveAddReportTab, ...rest } = props;

  const [activeTab, setActiveTab] = useState(activeAddReportTab);

  const eventsByCategory = useContext(ReportTypesContext);
  const patrolCategories = useContext(PatrolTypesContext);

  const [reportFilter, setReportFilter] = useState('');
  const [patrolFilter, setPatrolFilter] = useState('');

  const onReportFilterClear = useCallback(() => {
    setReportFilter('');
  }, []);

  const onReportSearchValueChange = useCallback(({ target: { value } }) => {
    setReportFilter(value);
  }, []);

  const onPatrolFilterClear = useCallback(() => {
    setPatrolFilter('');
  }, []);

  const onPatrolSearchValueChange = useCallback(({ target: { value } }) => {
    setPatrolFilter(value);
  }, []);

  useEffect(() => {
    setActiveAddReportTab(activeTab);
  }, [activeTab, setActiveAddReportTab]);

  return <Popover {...rest} ref={ref} className={styles.popover}> 
    <Popover.Content>
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className={styles.tabBar}>
        <Tab className={styles.tab} eventKey={TAB_KEYS.REPORTS} title="Add Report">
          <SearchBar className={styles.search} placeholder='Search' value={reportFilter}
            onChange={onReportSearchValueChange} onClear={onReportFilterClear} />
          <ReportTypeList categories={eventsByCategory} filter={reportFilter} onClickReportType={onClickReportType} />
        </Tab>
        {!!patrolCategories?.length && <Tab className={styles.tab} eventKey={TAB_KEYS.PATROLS} title="Add Patrol">
          <SearchBar className={styles.search} placeholder='Search' value={patrolFilter}
            onChange={onPatrolSearchValueChange} onClear={onPatrolFilterClear} />
          <ReportTypeList categories={patrolCategories} filter={patrolFilter} onClickReportType={onClickReportType} />
        </Tab>}
      </Tabs>
    </Popover.Content>
  </Popover>;
});


const AddReport = (props) => {
  const { analyticsMetadata, className = '', formProps, patrolTypes, reportData, eventsByCategory, activeAddReportTab, setActiveAddReportTab,
    map, popoverPlacement = 'auto', showLabel, showIcon, title, clickSideEffect } = props;

  const { hidePatrols } = formProps;

  const patrolFlagEnabled = useFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT);
  const hasPatrolWritePermissions = usePermissions(PERMISSION_KEYS.PATROLS, PERMISSIONS.CREATE);

  const patrolsEnabled = !!patrolFlagEnabled
    && !!hasPatrolWritePermissions 
    && !!patrolTypes.length 
    && !hidePatrols;

  
  const patrolCategories = useMemo(() => patrolsEnabled && [generatePseudoReportCategoryForPatrolTypes(patrolTypes)], [patrolTypes, patrolsEnabled]);

  const targetRef = useRef(null);
  const containerRef = useRef(null);

  const [popoverOpen, setPopoverState] = useState(false);

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

  return hasEventCategories &&
  
  <PatrolTypesContext.Provider value={patrolCategories}>
    <ReportTypesContext.Provider value={eventsByCategory}>
      <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} className={className}>
        <button title={title} className={styles.addReport} ref={targetRef}
          type='button' onClick={onButtonClick}>
          {showIcon && <AddButtonIcon />}
          {showLabel && <span>{title}</span>}
        </button>
        <Overlay show={popoverOpen} container={containerRef.current} target={targetRef.current} placement={popoverPlacement}>
          <AddReportPopover placement={popoverPlacement}  onClickReportType={startEditNewReport}
            setActiveAddReportTab={setActiveAddReportTab} activeAddReportTab={activeAddReportTab} />
        </Overlay>
      </div>
    </ReportTypesContext.Provider>
  </PatrolTypesContext.Provider>;
};

const mapStateToProps = (state, ownProps) => ({
  eventsByCategory: getUserCreatableEventTypesByCategory(state, ownProps),
  patrolTypes: state.data.patrolTypes,
  activeAddReportTab: state.view.activeAddReportTab,
});


export default connect(mapStateToProps, { setActiveAddReportTab })(memo(AddReport));

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