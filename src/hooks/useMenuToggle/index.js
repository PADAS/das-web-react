import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { FOCUS_INTENTS } from '../../Menu';

const FOCUS_INTENT_BY_OPENING_KEY = { ArrowDown: FOCUS_INTENTS.FIRST_OPTION, ArrowUp: FOCUS_INTENTS.LAST_OPTION };

const useMenuToggle = ({ defaultShow = false, isDisabled = false, onToggle } = {}) => {
  const menuId = useId();

  const wasShownRef = useRef(defaultShow);

  const [focusIntent, setFocusIntent] = useState(FOCUS_INTENTS.MENU);
  const [isShown, setIsShown] = useState(defaultShow);
  const [toggleButton, setToggleButton] = useState(null);

  // Closing without restoring focus: a click outside lands focus where the user
  // clicked, and pulling it back would scroll the page to the abandoned toggle.
  const hideMenu = useCallback(() => setIsShown(false), []);

  const closeMenu = useCallback(() => {
    hideMenu();

    toggleButton?.focus();
  }, [hideMenu, toggleButton]);

  // The menu takes no new action while the one it started is still running.
  const openMenu = (newFocusIntent) => {
    if (!isDisabled) {
      setFocusIntent(newFocusIntent);
      setIsShown(true);
    }
  };

  const onToggleClick = (event) => {
    if (isShown) {
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

  // A click on the toggle closes the menu twice, once from the toggle and once
  // as a click outside it, so only a change of state is reported.
  useEffect(() => {
    if (wasShownRef.current !== isShown) {
      wasShownRef.current = isShown;

      onToggle?.(isShown);
    }
  }, [isShown, onToggle]);

  return {
    menuProps: {
      anchor: toggleButton,
      focusIntent,
      id: menuId,
      onClose: closeMenu,
      onHide: hideMenu,
      show: isShown,
    },
    toggleProps: {
      'aria-controls': menuId,
      'aria-expanded': isShown,
      'aria-haspopup': 'menu',
      onClick: onToggleClick,
      onKeyDown: onToggleKeyDown,
      ref: setToggleButton,
    },
  };
};

export default useMenuToggle;
