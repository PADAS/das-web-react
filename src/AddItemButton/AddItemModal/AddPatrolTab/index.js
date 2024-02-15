import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import {
  createNewPatrolForPatrolType,
  generatePseudoReportCategoryForPatrolTypes,
  openModalForPatrol,
} from '../../../utils/patrols';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';
import { trackEvent } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const AddPatrolTab = ({ onHideModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addPatrolTab' });

  const map = useContext(MapContext);
  const { analyticsMetadata, formProps, onAddPatrol, patrolData } = useContext(AddItemContext);

  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const [searchText, setSearchText] = useState('');

  const patrolCategories = useMemo(
    () => [generatePseudoReportCategoryForPatrolTypes(patrolTypes)],
    [patrolTypes]
  );

  const onClickPatrolType = useCallback((patrolType) => {
    onHideModal();

    if (enableNewPatrolUI) {
      if (!!onAddPatrol) {
        onAddPatrol(formProps, patrolData, patrolType.id);
      } else {
        navigate(
          { pathname: `/${TAB_KEYS.PATROLS}/new`, search: `?patrolType=${patrolType.id}` },
          { state: { patrolData, temporalId: uuid() } },
          { formProps }
        );
      }
    } else {
      openModalForPatrol(createNewPatrolForPatrolType(patrolType, patrolData), map, formProps);
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add '${patrolType.display}' Report button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [
    analyticsMetadata.category,
    analyticsMetadata.location,
    enableNewPatrolUI,
    formProps,
    map,
    navigate,
    onAddPatrol,
    onHideModal,
    patrolData,
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

AddPatrolTab.propTypes = {
  onHideModal: PropTypes.func.isRequired,
};

export default memo(AddPatrolTab);
