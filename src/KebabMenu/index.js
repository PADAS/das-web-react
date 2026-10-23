import { useCallback, useId, useMemo, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';

import Menu, { FOCUS_INTENTS } from '../Menu';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 18;

const FOCUS_INTENT_BY_OPENING_KEY = { ArrowDown: FOCUS_INTENTS.FIRST_OPTION, ArrowUp: FOCUS_INTENTS.LAST_OPTION };

const KebabMenu = ({
  align = 'start',
  'aria-label': ariaLabel,
  backgroundColor,
  children,
  className = '',
  defaultShow = false,
  dotColor,
  isLoading = false,
  size,
  title,
  ...rest
}) => {
  const menuId = useId();

  const [focusIntent, setFocusIntent] = useState(FOCUS_INTENTS.MENU);
  const [show, setShow] = useState(defaultShow);
  const [toggleButton, setToggleButton] = useState(null);

  // Closing without restoring focus: a click outside lands focus where the user
  // clicked, and pulling it back would scroll the list to the abandoned toggle.
  const hideMenu = useCallback(() => setShow(false), []);

  const closeMenu = useCallback(() => {
    hideMenu();

    toggleButton?.focus();
  }, [hideMenu, toggleButton]);

  // The menu takes no new action while the one it started is still running.
  const openMenu = (newFocusIntent) => {
    if (!isLoading) {
      setFocusIntent(newFocusIntent);
      setShow(true);
    }
  };

  const toggleStyle = useMemo(() => ({
    ...(backgroundColor ? { '--kebab-menu-background-color': backgroundColor } : null),
    ...(dotColor ? { '--kebab-menu-dot-color': dotColor } : null),
    ...(size ? { '--kebab-menu-size': size } : null),
  }), [backgroundColor, dotColor, size]);

  const onToggleClick = (event) => {
    if (show) {
      hideMenu();
    } else {
      // A click with no detail is keyboard-driven. Focus the first option.
      openMenu(event.detail === 0 ? FOCUS_INTENTS.FIRST_OPTION : FOCUS_INTENTS.MENU);
    }
  };

  const onToggleKeyDown = (event) => {
    if (FOCUS_INTENT_BY_OPENING_KEY[event.key]) {
      event.preventDefault();

      openMenu(FOCUS_INTENT_BY_OPENING_KEY[event.key]);
    }
  };

  return <div className={`${styles.kebabMenu} ${className}`} {...rest}>
    <button
      aria-busy={isLoading}
      aria-controls={menuId}
      aria-disabled={isLoading}
      aria-expanded={show}
      aria-haspopup="menu"
      aria-label={ariaLabel}
      className={styles.toggle}
      onClick={onToggleClick}
      onKeyDown={onToggleKeyDown}
      ref={setToggleButton}
      style={toggleStyle}
      title={title}
      type="button"
    >
      {isLoading
        ? <MoonLoader aria-hidden color="currentColor" size={LOADER_SIZE} />
        : <span aria-hidden="true" className={styles.dots} />}
    </button>

    <Menu
      anchor={toggleButton}
      aria-label={ariaLabel}
      focusIntent={focusIntent}
      id={menuId}
      onClose={closeMenu}
      onHide={hideMenu}
      placement={align === 'end' ? 'bottom-end' : 'bottom-start'}
      show={show}
    >
      {children}
    </Menu>
  </div>;
};

KebabMenu.Divider = Menu.Divider;
KebabMenu.Option = Menu.Option;

export default KebabMenu;
