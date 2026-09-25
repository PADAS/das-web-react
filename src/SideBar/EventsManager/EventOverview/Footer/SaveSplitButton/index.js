import React, { useEffect, useId, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import navigateMenuWithKeyboard from '../../../../utils/navigateMenuWithKeyboard';

import * as styles from './styles.module.scss';

const EMPTY_OPTIONS = [];

const FOCUS_INTENTS = { FIRST: 'first', LAST: 'last' };

const SAVE_LOADER_SIZE = 18;

const SaveSplitButton = ({
  className = '',
  isSaveDisabled = false,
  isSaving = false,
  label,
  menuLabel,
  onSave,
  options = EMPTY_OPTIONS,
}) => {
  const optionRefs = useRef([]);
  const pendingFocusIntentRef = useRef(null);

  const menuId = useId();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toggleAnchor, setToggleAnchor] = useState(null);

  const openMenu = (focusIntent = null) => {
    pendingFocusIntentRef.current = focusIntent;

    setIsMenuOpen(true);
  };

  // Closing without restoring focus: a click outside lands focus where the user
  // clicked, and pulling it back would scroll the view to the abandoned toggle.
  const hideMenu = () => setIsMenuOpen(false);

  const closeMenu = () => {
    hideMenu();

    toggleAnchor?.focus();
  };

  const focusOption = (focusIntent) => {
    const optionNodes = optionRefs.current.filter(Boolean);

    (focusIntent === FOCUS_INTENTS.FIRST ? optionNodes[0] : optionNodes.at(-1))?.focus();
  };

  const onMenuKeyDown = (event) => navigateMenuWithKeyboard(event, optionRefs.current.filter(Boolean), closeMenu);

  const onOptionClick = (option) => {
    closeMenu();

    option.onClick();
  };

  const onToggleClick = (event) => {
    if (isMenuOpen) {
      hideMenu();
    } else {
      // A click with no detail is keyboard-driven. Focus the first option.
      openMenu(event.detail === 0 ? FOCUS_INTENTS.FIRST : null);
    }
  };

  const onToggleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      const focusIntent = event.key === 'ArrowDown' ? FOCUS_INTENTS.FIRST : FOCUS_INTENTS.LAST;

      // A menu opened with the mouse leaves focus on the toggle.
      if (isMenuOpen) {
        focusOption(focusIntent);
      } else {
        openMenu(focusIntent);
      }
    }
  };

  useEffect(() => {
    if (isMenuOpen && pendingFocusIntentRef.current) {
      focusOption(pendingFocusIntentRef.current);

      pendingFocusIntentRef.current = null;
    }
  }, [isMenuOpen]);

  return <div
    className={`${styles.saveSplitButton} ${options.length > 0 ? styles.hasOptions : ''} ${className}`}
    role="group"
    >
    <button
      aria-busy={isSaving}
      className={styles.saveButton}
      disabled={isSaveDisabled || isSaving}
      onClick={onSave}
      type="button"
      >
      <span className={styles.saveButtonLabel}>{label}</span>

      {isSaving && <span className={styles.saveButtonLoader}>
        <MoonLoader aria-hidden color="white" size={SAVE_LOADER_SIZE} />
      </span>}
    </button>

    {options.length > 0 && <>
      <button
        aria-controls={isMenuOpen ? menuId : undefined}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={menuLabel}
        className={styles.toggle}
        disabled={isSaving}
        onClick={onToggleClick}
        onKeyDown={onToggleKeyDown}
        ref={setToggleAnchor}
        title={menuLabel}
        type="button"
      >
        <span aria-hidden="true" className={`${styles.caret} ${isMenuOpen ? styles.open : ''}`} />
      </button>

      <Overlay flip onHide={hideMenu} placement="top-end" rootClose show={isMenuOpen} target={toggleAnchor}>
        <Popover className={styles.menuPopover} role="presentation">
          <ul aria-label={menuLabel} className={styles.menu} id={menuId} onKeyDown={onMenuKeyDown} role="menu">
            {options.map((option, index) => <li className={styles.menuItem} key={option.key} role="none">
              <button
                className={styles.menuItemOption}
                onClick={() => onOptionClick(option)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="menuitem"
                tabIndex={-1}
                type="button"
              >
                {option.label}
              </button>
            </li>)}
          </ul>
        </Popover>
      </Overlay>
    </>}
  </div>;
};

export default SaveSplitButton;
