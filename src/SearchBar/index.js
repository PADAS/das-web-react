import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { ReactComponent as ClearButton } from '../common/images/icons/close-icon.svg';
import styles from './styles.module.scss';

const SearchBar = memo((props) => {
  const [active, setActiveState] = useState(false);
  const { text, onChange, placeholder, className, ...rest } = props;
  
  const searchBoxRef = useRef(null);
  const clearButtonRef = useRef(null);
  
  const setActive = () => setActiveState(true);
  const setInactive = () => setActiveState(false);

  const onClearButtonClick = () => {
    searchBoxRef.current.value = '';
    onChange({target: {value: searchBoxRef.current.value}});
    trackEvent('General', 'Click Clear Search button');
  };

  return <label className={`${styles.search} ${active && styles.active} ${className ? className : ''}`} {...rest}>
    <SearchIcon className={styles.searchIcon} />
    <input ref={searchBoxRef} onFocus={setActive} placeholder={placeholder} onBlur={setInactive} onChange={onChange} defaultValue={text} type="text" />
    <ClearButton ref={clearButtonRef} className={styles.clearButton} onClick={onClearButtonClick}/>
  </label>;
});

SearchBar.defaultProps = {
  placeholder: 'Search...',
};

SearchBar.propTypes = {
  text: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default SearchBar;