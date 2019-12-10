import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';
import styles from './styles.module.scss';

const SearchBar = (props) => {
  const { value, onChange, onClear, placeholder, className, ...rest } = props;

  const [isActive, setIsActiveState] = useState(false);
  const isFiltered = !!value && !!value.length;
  // we encapsulate the value in state here to support seemingly-immediate updates of potentially debounced form values.

  const onInputFocus = () => setIsActiveState(true);
  const onInputBlur = () => setIsActiveState(false);


  const onInputChange = (e) => {
    onChange(e);
  };
  
  const onClearClick = (e) => {
    onClear(e);
  };

  return <label className={`${styles.search} ${isFiltered && styles.isFiltered} ${isActive && styles.isActive} ${className ? className : ''}`} {...rest}>
    <SearchIcon className={styles.searchIcon} />
    <input placeholder={placeholder} value={value} type="text" 
      onChange={onInputChange} onFocus={onInputFocus} onBlur={onInputBlur}/>
    <button className={styles.clearButton} onClick={onClearClick}>
      <ClearIcon className={styles.clearIcon} />
    </button>    
  </label>;
};

SearchBar.defaultProps = {
  placeholder: 'Search...',
  onChange() {},
  onClear() {},
};

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};

export default memo(SearchBar);