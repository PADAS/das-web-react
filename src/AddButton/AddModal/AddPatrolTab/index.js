import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { addReportFormProps } from '../../../proptypes';
import { createNewPatrolForPatrolType, generatePseudoReportCategoryForPatrolTypes, openModalForPatrol } from '../../../utils/patrols';
import { FEATURE_FLAG_LABELS, TAB_KEYS } from '../../../constants';
import { MapContext } from '../../../App';
import { trackEvent } from '../../../utils/analytics';
import { useFeatureFlag } from '../../../hooks';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const AddPatrolTab = ({ analyticsMetadata, formProps, navigate, onAddPatrol, onHideModal, patrolData }) => {
  const map = useContext(MapContext);

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

  const onSearchTextChange = useCallback((event) => setSearchText(event.target.value), []);

  const onSearchTextClear = useCallback(() => setSearchText(''), []);

  return !!patrolCategories?.length && <>
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

AddPatrolTab.defaultProps = {
  analyticsMetadata: {
    category: 'Feed',
    location: null,
  },
  formProps: {
    hidePatrols: false,
    isPatrolReport: false,
    onSaveError: null,
    onSaveSuccess: null,
    relationshipButtonDisabled: false,
  },
  onAddPatrol: null,
  patrolData: {},
};

AddPatrolTab.propTypes = {
  analyticsMetadata: PropTypes.shape({
    category: PropTypes.string,
    location: PropTypes.string,
  }),
  formProps: addReportFormProps,
  navigate: PropTypes.func.isRequired,
  onAddPatrol: PropTypes.func,
  onHideModal: PropTypes.func.isRequired,
  patrolData: PropTypes.object,
};

export default memo(AddPatrolTab);
