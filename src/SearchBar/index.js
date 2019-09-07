import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { ReactComponent as ClearButton } from '../common/images/icons/close-icon.svg';
import styles from './styles.module.scss';

const SearchBar = memo((props) => {
  const { text, onChange, onClear, placeholder, className, ...rest } = props;

  const [active, setActiveState] = useState(false);

  const searchBoxRef = useRef(null);
  const clearButtonRef = useRef(null);
  
  const setActive = () => setActiveState(true);
  const setInactive = () => setActiveState(false);

  const onClearClick = (e) => {
    searchBoxRef.current.value = '';
    onClear(e);
  };

  return <label className={`${styles.search} ${active && styles.active} ${className ? className : ''}`} {...rest}>
    <SearchIcon className={styles.searchIcon} />
    <input ref={searchBoxRef} onFocus={setActive} placeholder={placeholder} 
      onBlur={setInactive} onChange={onChange} defaultValue={text} type="text" />
    <ClearButton ref={clearButtonRef} className={styles.clearButton} onClick={onClearClick}/>
  </label>;
});

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

export default SearchBar;