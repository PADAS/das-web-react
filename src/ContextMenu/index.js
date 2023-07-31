import React, { useCallback, useEffect, useState, memo } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import styles from './styles.module.scss';

const { Menu } = Dropdown;

const ContextMenu = ({ options, disabled, children }) => {
  const [toggleContextMenu, setToggleContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({});

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const eventItem = e.target.getBoundingClientRect();

    setMenuPosition({
      top: e.clientY - eventItem.top,
      left: e.clientX - eventItem.left,
    });
    disabled || setToggleContextMenu(!toggleContextMenu);
  }, [disabled, toggleContextMenu, setMenuPosition]);

  const handleClick = useCallback(() => {
    setToggleContextMenu(false);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return <div className={styles.menuContainer} onContextMenu={handleContextMenu} data-testid='contextMenuToggle'>
    <Menu show={toggleContextMenu} style={menuPosition}>
      {options}
    </Menu>
    {children}
  </div>;
};

ContextMenu.defaultProps = {
  disabled: false
};

ContextMenu.propTypes = {
  children: PropTypes.element.isRequired,
  options: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
};

export default memo(ContextMenu);
