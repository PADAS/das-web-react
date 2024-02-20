import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import { getUserCreatableEventTypesByCategory } from '../../../selectors';
import  { TAB_KEYS } from '../../../constants';
import { trackEvent } from '../../../utils/analytics';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import Select from '../../../Select';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const SCROLL_OFFSET_CORRECTION = 96;

const AddReportTab = ({ onHideModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addReportTab' });

  const { analyticsMetadata, formProps, onAddReport, reportData = {} } = useContext(AddItemContext);

  const eventsByCategory = useSelector(getUserCreatableEventTypesByCategory);

  const reportTypesListRef = useRef(null);

  const [searchText, setSearchText] = useState('');

  const onClickReportType = useCallback((reportType) => {
    onHideModal();

    const reportDataToEdit = { ...reportData };
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

      <Select
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

AddReportTab.propTypes = {
  onHideModal: PropTypes.func.isRequired,
};

export default memo(AddReportTab);
