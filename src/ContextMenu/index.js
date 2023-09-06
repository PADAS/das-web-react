import React, { useCallback, useEffect, useState, memo, useRef } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import styles from './styles.module.scss';

const { Menu } = Dropdown;

const ContextMenu = ({ options, disabled, className, children }) => {
  const [toggleContextMenu, setToggleContextMenu] = useState(false);
  const menuRef = useRef();

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    disabled || setToggleContextMenu(!toggleContextMenu);
  }, [disabled, toggleContextMenu]);

  const closeMenu = useCallback(() => {
    setToggleContextMenu(false);
  }, []);

  const handleCloseContextMenu = useCallback((e) => {
    if (!menuRef?.current?.contains(e.target)){
      closeMenu();
    }
  }, [closeMenu]);

  useEffect(() => {
    window.addEventListener('click', closeMenu);
    window.addEventListener('contextmenu', handleCloseContextMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('contextmenu', handleCloseContextMenu);
    };
  }, []);

  return <div className={`${styles.menuContainer} ${className}`} onContextMenu={handleContextMenu} data-testid='contextMenuToggle' ref={menuRef}>
    <Menu show={toggleContextMenu} className={styles.menu}>
      {options}
    </Menu>
    {children}
  </div>;
};

ContextMenu.defaultProps = {
  disabled: false,
  className: '',
};

ContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  options: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default memo(ContextMenu);
