import React, { memo, useState } from 'react';
import uuid from 'uuid';
import PropTypes from 'prop-types';

import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';

import styles from './styles.module.scss';

const SearchBar = (props) => {
  const [active, setActiveState] = useState(false);
  const { text, onChange, placeholder, ...rest } = props;
  const id = `search-bar-${uuid()}`;

  const setActive = () => setActiveState(true);
  const setInactive = () => setActiveState(false);

  return <label htmlFor={id} className={`${styles.search} ${active && styles.active}`} {...rest}>
    <SearchIcon />
    <input onFocus={setActive} placeholder={placeholder} onBlur={setInactive} onChange={onChange} type="text" id={`search-bar-${id}`} />
  </label>;
};

SearchBar.defaultProps = {
  placeholder: 'Search...',
};

SearchBar.propTypes = {
  text: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default memo(SearchBar);