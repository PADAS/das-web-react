import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';

import styles from './styles.module.scss';

const SearchBar = (props) => {
  const { value, onChange, onClear, className, ...restProps } = props;
  const { t } = useTranslation('filters', { keyPrefix: 'searchBar' });
  const {
    placeholder = t('defaultPlaceHolder')
  } = restProps;
  const [isActive, setIsActiveState] = useState(false);
  const isFiltered = !!value && !!value.length;
  // we encapsulate the value in state here to support seemingly-immediate updates of potentially debounced form values.

  const onInputFocus = () => setIsActiveState(true);
  const onInputBlur = () => setIsActiveState(false);
  const onInputChange = (e) => onChange(e);
  const onClearClick = (e) => onClear?.(e);

  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
    }
  };

  return <label className={`${styles.search} ${styles.oldNavigation} ${isFiltered && styles.isFiltered} ${isActive && styles.isActive} ${className ? className : ''}`} {...restProps}>
    <SearchIcon className={styles.searchIcon} />
    <input placeholder={placeholder} value={value} type="text" onKeyDown={onKeyDown} onChange={onInputChange} onFocus={onInputFocus} onBlur={onInputBlur} data-testid='search-input'/>
    <button className={styles.clearButton} onClick={onClearClick} data-testid='reset-search-button'>
      <ClearIcon title={t('iconTitle')} className={styles.clearIcon} />
    </button>
  </label>;
};

SearchBar.defaultProps = {
  onChange: null,
  onClear: null
};

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};

export default memo(SearchBar);