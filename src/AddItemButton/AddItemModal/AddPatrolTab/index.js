import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { AddItemContext } from '../..';
import { createNewPatrolForPatrolType, generatePseudoReportCategoryForPatrolTypes, openModalForPatrol } from '../../../utils/patrols';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';
import { trackEvent } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';
import { uuid } from '../../../utils/string';
import { useSelector } from 'react-redux';

import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const AddPatrolTab = ({ navigate, onHideModal }) => {
  const map = useContext(MapContext);
  const { analyticsMetadata, formProps, onAddPatrol, patrolData } = useContext(AddItemContext);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

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

  const onSearchTextChange = useCallback((event) => setSearchText(event.target.value), []);

  const onSearchTextClear = useCallback(() => setSearchText(''), []);

  return <>
    <div className={styles.typesSearchControls}>
      <SearchBar
        className={styles.searchBar}
        onChange={onSearchTextChange}
        onClear={onSearchTextClear}
        placeholder="Search"
        value={searchText}
      />
    </div>

    <TypesList filterText={searchText} onClickType={onClickPatrolType} typesByCategory={patrolCategories} />
  </>;
};

AddPatrolTab.propTypes = {
  navigate: PropTypes.func.isRequired,
  onHideModal: PropTypes.func.isRequired,
};

export default memo(AddPatrolTab);
