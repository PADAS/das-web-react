import React, { forwardRef, useCallback, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';

import KebabMenuIcon from '../KebabMenuIcon';

import styles from './styles.module.scss';

const Option = ({ className = '', children, ...rest }) => (
  <Dropdown.Item className={`${styles.itemBtn} ${className}`} {...rest}>
    {children}
  </Dropdown.Item>
);

const Menu = ({ children, className, defaultShow, ...rest }, ref) => {
  const [show, setShow] = useState(defaultShow);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setShow(false);
      event.stopPropagation();
    }
  }, []);

  return (
    <Dropdown
        className={`${styles.kebabMenu} ${className}`}
        onKeyDown={onKeyDown}
        onToggle={(nextShow) => setShow(nextShow)}
        show={show}
        {...rest}
      >
      <Dropdown.Toggle as='button'>
        <KebabMenuIcon />
      </Dropdown.Toggle>

      <Dropdown.Menu ref={ref} className={styles.menuDropdown}>
        {children}
      </Dropdown.Menu>
    </ Dropdown>
  );
};

const MenuForwardRef = forwardRef(Menu);

MenuForwardRef.defaultProps = {
  className: '',
  defaultShow: false,
};

MenuForwardRef.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.element]).isRequired,
  defaultShow: PropTypes.bool,
  className: PropTypes.string,
};

const KebabMenu = {
  ...MenuForwardRef,
  Option: Option
};

export default KebabMenu;
