import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddItemContext } from '../..';
import { TAB_KEYS } from '../../../constants';
import { trackEvent } from '../../../utils/analytics';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import SearchBar from '../../../SearchBar';
import PatrolTypeIcon from '../../../PatrolTypeIcon';

import * as styles from '../styles.module.scss';
import * as typesListStyles from '../TypesList/styles.module.scss';

// Prototype patrol types — only these show in the picker
const PROTOTYPE_PATROL_TYPES = [
  { id: 'Vehicle Patrol', display: 'Vehicle Patrol' },
  { id: 'Foot Patrol', display: 'Foot Patrol' },
  { id: 'Aerial Patrol', display: 'Aerial Patrol' },
  { id: 'Routine Patrol', display: 'Routine Patrol' },
];

// Custom list item for the patrol-type picker — same grid card layout as
// TypesList/EventTypeListItem, but using our PatrolTypeIcon so Vehicle / Aerial
// pick up the sprite icons with their built-in P badge while Foot / Routine
// keep the existing local PatrolIcon.
const PatrolTypeListItem = ({ type, onClick }) => <li className={typesListStyles.typeListItem}>
  <button data-testid={`categoryList-button-${type.id}`} onClick={() => onClick(type)} type="button">
    <span>
      <PatrolTypeIcon patrolType={type.id} />
      {type.display}
    </span>
  </button>
</li>;

const AddPatrolTab = ({ onHideModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'addItemButton.addItemModal.addPatrolTab' });
  const { analyticsMetadata, formProps, onAddPatrol, patrolData } = useContext(AddItemContext);
  const [searchText, setSearchText] = useState('');

  const onClickPatrolType = useCallback((patrolType) => {
    onHideModal();

    if (!!onAddPatrol) {
      onAddPatrol(formProps, patrolData, patrolType.id);
    } else {
      navigate(
        { pathname: `/${TAB_KEYS.PATROLS}/new`, search: `?patrolType=${encodeURIComponent(patrolType.id)}` },
        { state: { patrolData, temporalId: uuid() } },
        { formProps }
      );
    }

    trackEvent(
      analyticsMetadata.category,
      `Click Add Patrol${!!analyticsMetadata.location && ` from ${analyticsMetadata.location}`}`
    );
  }, [analyticsMetadata.category, analyticsMetadata.location, formProps, navigate, onAddPatrol, onHideModal, patrolData]);

  const filteredTypes = useMemo(() => {
    const q = searchText.toLowerCase();
    return PROTOTYPE_PATROL_TYPES.filter((t) => t.display.toLowerCase().includes(q));
  }, [searchText]);

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

    <div className={typesListStyles.typesContainer}>
      <ul className={typesListStyles.typesList}>
        {filteredTypes.map((type) => (
          <PatrolTypeListItem key={type.id} type={type} onClick={onClickPatrolType} />
        ))}
      </ul>
    </div>
  </>;
};

export default memo(AddPatrolTab);
