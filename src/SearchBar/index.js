import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../common/images/icons/cross.svg';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import * as styles from './styles.module.scss';

const SearchBar = ({ className = '', onClear = null, value, ...otherProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'searchBar' });

  const searchInputRef = useRef();

  return <div
      className={`${styles.searchBar} ${value ? styles.hasValue : ''} ${className}`}
      data-testid="searchBar"
      onClick={() => searchInputRef.current.focus()}
    >
    <span aria-hidden className={styles.searchIconContainer}>
      <SearchIcon />
    </span>

    <input
      className={styles.searchInput}
      placeholder={t('defaultPlaceholder')}
      ref={searchInputRef}
      type="search"
      value={value}
      {...otherProps}
    />

    {onClear && value && <button
      aria-label={t('clearButtonLabel')}
      className={styles.clearButton}
      data-testid="reset-search-button"
      onClick={onClear}
      tabIndex={-1}
      title={t('clearButtonLabel')}
      type="button"
    >
      <CrossIcon />
    </button>}
  </div>;
};

export default SearchBar;
