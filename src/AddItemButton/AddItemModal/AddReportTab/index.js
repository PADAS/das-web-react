import React, { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { AddItemContext } from '../..';
import  { TAB_KEYS } from '../../../constants';
import { getUserCreatableEventTypesByCategory } from '../../../selectors';
import { trackEvent } from '../../../utils/analytics';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import Select from '../../../Select';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const SCROLL_OFFSET_CORRECTION = 96;

const AddReportTab = ({ navigate, onHideModal }) => {
  const { analyticsMetadata, formProps, onAddReport, reportData = {} } = useContext(AddItemContext);

  const reportDataToEdit = useMemo(() => ({ ...reportData }), [reportData]);

  const eventsByCategory = useSelector(getUserCreatableEventTypesByCategory);

  const reportTypesListRef = useRef(null);

  const [searchText, setSearchText] = useState('');

  const getQuickJumpSelectOptionLabel = useCallback((option) => option.display, []);

  const onClickReportType = useCallback((reportType) => {
    onHideModal();

    if (reportType.geometry_type !== 'Point') {
      delete reportDataToEdit.location;
    }

    if (!!onAddReport) {

      onAddReport(formProps, reportDataToEdit, reportType.id);
    } else {
      navigate(
        { pathname: `/${TAB_KEYS.REPORTS}/new`, search: `?reportType=${reportType.id}` },
        { state: { reportData: reportDataToEdit, temporalId: uuid() } },
        { formProps }
      );
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add '${reportType.display}' Report button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [
    analyticsMetadata.category,
    analyticsMetadata.location,
    formProps,
    navigate,
    onAddReport,
    onHideModal,
    reportDataToEdit,
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
