import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import {
  generatePseudoReportCategoryForPatrolTypes
} from '../../../utils/patrols';
import { TAB_KEYS } from '../../../constants';
import { trackEvent } from '../../../utils/analytics';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import TypesList from '../TypesList';

import styles from '../styles.module.scss';

const AddPatrolTab = ({ onHideModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addPatrolTab' });
  const { analyticsMetadata, formProps, onAddPatrol, patrolData } = useContext(AddItemContext);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const [searchText, setSearchText] = useState('');
  const patrolCategories = useMemo(
    () => [generatePseudoReportCategoryForPatrolTypes(patrolTypes)],
    [patrolTypes]
  );

  const onClickPatrolType = useCallback((patrolType) => {
    onHideModal();

    if (!!onAddPatrol) {
      onAddPatrol(formProps, patrolData, patrolType.id);
    } else {
      navigate(
        { pathname: `/${TAB_KEYS.PATROLS}/new`, search: `?patrolType=${patrolType.id}` },
        { state: { patrolData, temporalId: uuid() } },
        { formProps }
      );
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add '${patrolType.display}' Report button${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location, formProps, navigate, onAddPatrol, onHideModal, patrolData]);

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
