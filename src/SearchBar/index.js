import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import * as styles from './styles.module.scss';

const SearchBar = ({ className = '', onChange, onClear = null, placeholder = null, value, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'searchBar' });

  const [isActive, setIsActiveState] = useState(false);

  return <label
      className={`${styles.search} ${styles.oldNavigation} ${value?.length && styles.isFiltered} ${isActive && styles.isActive} ${className ? className : ''}`}
      {...restProps}
    >
    <SearchIcon className={styles.searchIcon} />

    <input
      data-testid="search-input"
      onBlur={() => setIsActiveState(false)}
      onChange={onChange}
      onFocus={() => setIsActiveState(true)}
      onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
      placeholder={placeholder || t('defaultPlaceholder')}
      type="text"
      value={value}
    />

    <button className={styles.clearButton} data-testid="reset-search-button" onClick={(event) => onClear?.(event)}>
      <ClearIcon title={t('clearIconTitle')} />
    </button>
  </label>;
};

export default memo(SearchBar);
