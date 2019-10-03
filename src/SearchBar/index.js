import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';
import styles from './styles.module.scss';

const SearchBar = (props) => {
  const { text, onChange, onClear, placeholder, className, ...rest } = props;

  const [isActive, setIsActiveState] = useState(false);
  const [isFiltered, setIsFilteredState] = useState(false);

  const searchBoxRef = useRef(null);
  const clearButtonRef = useRef(null);
  
  const onInputFocus = () => setIsActiveState(true);
  const onInputBlur = () => setIsActiveState(false);

  const onInputChange = (e) => {
    if (e.target.value && !!e.target.value.length)
      setIsFilteredState(true); 
    else
      setIsFilteredState(false); 
    onChange(e);
  };

  const onClearClick = (e) => {
    searchBoxRef.current.value = '';
    setIsFilteredState(false); 
    onClear(e);
  };

  return <label className={`${styles.search} ${isFiltered && styles.isFiltered} ${isActive && styles.isActive} ${className ? className : ''}`} {...rest}>
    <SearchIcon className={styles.searchIcon} />
    <input ref={searchBoxRef} placeholder={placeholder} defaultValue={text} type="text" 
      onChange={onInputChange} onFocus={onInputFocus} onBlur={onInputBlur}/>
    <button ref={clearButtonRef} className={styles.clearButton} onClick={onClearClick}>
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
  text: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};

export default memo(SearchBar);