import { memo, useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import { generatePseudoReportCategoryForPatrolTypes } from '../../../utils/patrols';
import { PATROL_TYPE_QUERY_PARAMETER, PREVIEW_FEATURES, TAB_KEYS } from '../../../constants';
import { trackEvent } from '../../../utils/analytics';
import useNavigate from '../../../hooks/useNavigate';
import { usePreviewFeature } from '../../../hooks';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import * as styles from '../styles.module.scss';

const AddPatrolTab = ({ onHideModal }) => {
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addPatrolTab' });

  const isPatrolSchemasEnabled = usePreviewFeature(PREVIEW_FEATURES.PATROL_SCHEMAS);
  const navigate = useNavigate();

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const { analyticsMetadata, formProps, onAddPatrol, patrolData, reportData } = useContext(AddItemContext);

  const [searchText, setSearchText] = useState('');

  const patrolCategories = useMemo(
    () => [generatePseudoReportCategoryForPatrolTypes(patrolTypes)],
    [patrolTypes]
  );

  const onClickPatrolType = useCallback((patrolType) => {
    onHideModal();

    // Map popups give their location as event data, and only new patrols use it.
    const newPatrolData = isPatrolSchemasEnabled && !!reportData?.location
      ? { location: reportData.location, ...patrolData }
      : patrolData;

    if (onAddPatrol) {
      onAddPatrol(formProps, newPatrolData, patrolType.id);
    } else {
      navigate(
        { pathname: `/${TAB_KEYS.PATROLS}/new`, search: `?${PATROL_TYPE_QUERY_PARAMETER}=${patrolType.id}` },
        { state: { patrolData: newPatrolData, temporalId: uuid() } },
        { formProps }
      );
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add Patrol${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [
    analyticsMetadata.category,
    analyticsMetadata.location,
    formProps,
    isPatrolSchemasEnabled,
    navigate,
    onAddPatrol,
    onHideModal,
    patrolData,
    reportData,
  ]);

  return <>
    <div className={styles.typesSearchControls}>
      <SearchBar
        className={styles.searchBar}
        onChange={(event) => setSearchText(event.target.value)}
        onClear={() => setSearchText('')}
        placeholder={t('searchBarPlaceholder')}
        value={searchText}
      />
    </div>

    <TypesList filterText={searchText} onClickType={onClickPatrolType} typesByCategory={patrolCategories} />
  </>;
};

export default memo(AddPatrolTab);
