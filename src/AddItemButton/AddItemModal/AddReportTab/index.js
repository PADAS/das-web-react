import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { AddItemContext } from '../..';
import { createNewReportForEventType, openModalForReport } from '../../../utils/events';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { getUserCreatableEventTypesByCategory } from '../../../selectors';
import { MapContext } from '../../../App';
import { trackEvent } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import Select from '../../../Select';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const { ENABLE_REPORT_NEW_UI } = FEATURE_FLAG_LABELS;

const SCROLL_OFFSET_CORRECTION = 96;

const AddReportTab = ({ navigate, onHideModal }) => {
  const map = useContext(MapContext);
  const { analyticsMetadata, formProps, onAddReport, reportData } = useContext(AddItemContext);

  const reportDataToEdit = { ...reportData };

  const enableNewReportUI = useFeatureFlag(ENABLE_REPORT_NEW_UI);

  const eventsByCategory = useSelector(getUserCreatableEventTypesByCategory);

  const reportTypesListRef = useRef(null);

  const [searchText, setSearchText] = useState('');

  const getQuickJumpSelectOptionLabel = useCallback((option) => option.display, []);

  const onClickReportType = useCallback((reportType) => {
    onHideModal();

    if (reportType.geometry_type !== 'Point') {
      delete reportDataToEdit.location;
    }

    if (enableNewReportUI) {
      if (!!onAddReport) {

        onAddReport(formProps, reportDataToEdit, reportType.id);
      } else {
        navigate(
          { pathname: `/${TAB_KEYS.REPORTS}/new`, search: `?reportType=${reportType.id}` },
          { state: { reportData: reportDataToEdit, temporalId: uuid() } },
          { formProps }
        );
      }
    } else {
      openModalForReport(createNewReportForEventType(reportType, reportDataToEdit), map, formProps);
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add '${reportType.display}' Report button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [
    analyticsMetadata.category,
    analyticsMetadata.location,
    enableNewReportUI,
    formProps,
    map,
    navigate,
    onAddReport,
    onHideModal,
    reportData,
  ]);

  const onSearchTextChange = useCallback((event) => setSearchText(event.target.value), []);

  const onSearchTextClear = useCallback(() => setSearchText(''), []);

  const onQuickJumpSelectChange = useCallback((category) => {
    const targetList = reportTypesListRef?.current?.querySelector(`#${category.value}-quick-select`);
    if (targetList) {
      reportTypesListRef.current.scrollTop = (targetList.offsetTop - SCROLL_OFFSET_CORRECTION);
    }
  }, []);

  return <>
    <div className={styles.typesSearchControls}>
      <SearchBar
        className={styles.searchBar}
        onChange={onSearchTextChange}
        onClear={onSearchTextClear}
        placeholder="Search"
        value={searchText}
      />

      <Select
        className={styles.quickJumpSelect}
        data-testid='addItemButton-addItemModal-addReportTab-quickJumpSelect'
        getOptionLabel={getQuickJumpSelectOptionLabel}
        isSearchable
        onChange={onQuickJumpSelectChange}
        options={eventsByCategory}
        placeholder="Jump to..."
      />
    </div>

    <TypesList
      filterText={searchText}
      onClickType={onClickReportType}
      ref={reportTypesListRef}
      typesByCategory={eventsByCategory}
    />
  </>;
};

AddReportTab.propTypes = {
  navigate: PropTypes.func.isRequired,
  onHideModal: PropTypes.func.isRequired,
};

export default memo(AddReportTab);
