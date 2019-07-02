import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import styles from './styles.module.scss';

const SearchBar = memo((props) => {
  const [active, setActiveState] = useState(false);
  const { text, onChange, placeholder, className, ...rest } = props;

  const setActive = () => setActiveState(true);
  const setInactive = () => setActiveState(false);

  return <label className={`${styles.search} ${active && styles.active} ${className ? className : ''}`} {...rest}>
    <SearchIcon />
    <input onFocus={setActive} placeholder={placeholder} onBlur={setInactive} onChange={onChange} defaultValue={text} type="text" />
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