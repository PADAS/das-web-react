import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import { selectCreatableEventTypesByCategory } from '../../../selectors/event-types';
import  { TAB_KEYS } from '../../../constants';
import { trackEvent } from '../../../utils/analytics';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import LegacySelect from '../../../LegacySelect';
import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import * as styles from '../styles.module.scss';

const SCROLL_OFFSET_CORRECTION = 96;

const AddReportTab = ({ onHideModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addReportTab' });

  const { analyticsMetadata, formProps, onAddReport, reportData = {} } = useContext(AddItemContext);

  const eventsByCategory = useSelector(selectCreatableEventTypesByCategory);

  const reportTypesListRef = useRef(null);

  const [searchText, setSearchText] = useState('');

  const onClickReportType = useCallback((reportType) => {
    onHideModal();

    const reportDataToEdit = { ...reportData };
    if (reportType.geometry_type !== 'Point') {
      delete reportDataToEdit.location;
    }

    if (onAddReport) {
      onAddReport(formProps, reportDataToEdit, reportType.id);
    } else {
      navigate(
        { pathname: `/${TAB_KEYS.EVENTS}/new`, search: `?reportType=${reportType.id}` },
        { state: { reportData: reportDataToEdit, temporalId: uuid() } },
        { formProps }
      );
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add Report${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [
    analyticsMetadata.category,
    analyticsMetadata.location,
    formProps,
    navigate,
    onAddReport,
    onHideModal,
    reportData,
  ]);

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
        onChange={(event) => setSearchText(event.target.value)}
        onClear={() => setSearchText('')}
        placeholder={t('searchBarPlaceholder')}
        value={searchText}
      />

      <LegacySelect
        className={styles.quickJumpSelect}
        data-testid="addItemButton-addItemModal-addReportTab-quickJumpSelect"
        getOptionLabel={(option) => option.display}
        isSearchable
        onChange={onQuickJumpSelectChange}
        options={eventsByCategory}
        placeholder={t('reportsSelectPlaceholder')}
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

export default memo(AddReportTab);
