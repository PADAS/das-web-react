import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import * as styles from './styles.module.scss';

const MenuContext = createContext(null);

const FOCUS_INTENT_FIRST = 'first';
const FOCUS_INTENT_LAST = 'last';

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled)',
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const focusItemNode = (node) => {
  const focusable = node?.matches(FOCUSABLE_SELECTOR) ? node : node?.querySelector(FOCUSABLE_SELECTOR);

  focusable?.focus();

  // Returns whether focus actually landed
  return !!focusable && document.activeElement === focusable;
};

const Option = ({
  as: Component = 'button',
  children,
  className = '',
  disabled = false,
  onClick,
  ref,
  ...rest
}) => {
  const { registerOption, closeMenu } = useContext(MenuContext);

  const nodeRef = useRef(null);

  const isButton = Component === 'button';

  const onClickOption = (event) => {
    if (disabled) {
      event.preventDefault();
    } else {
      onClick?.(event);

      closeMenu(event);
    }
  };

  const setNode = useCallback((node) => {
    nodeRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [nodeRef, ref]);

  useEffect(() => {
    const unregisterOption = registerOption(nodeRef, disabled);

    return () => unregisterOption?.();
  }, [disabled, registerOption]);

  return <li className={styles.item} role="none">
    <Component
      aria-disabled={!isButton && disabled ? true : undefined}
      className={`${styles.itemBtn} ${className}`}
      disabled={isButton ? disabled : undefined}
      onClick={onClickOption}
      ref={setNode}
      role="menuitem"
      tabIndex={-1}
      type={isButton ? 'button' : undefined}
      {...rest}
    >
      {children}
    </Component>
  </li>;
};

const Divider = ({ className = '' }) => (
  <li aria-orientation="horizontal" className={`${styles.divider} ${className}`} role="separator" />
);

const KebabMenu = ({
  align = 'start',
  'aria-label': ariaLabel,
  backgroundColor,
  children,
  className = '',
  defaultShow = false,
  dotColor,
  ref,
  size,
  title,
  ...rest
}) => {
  const menuId = useId();

  const optionsRef = useRef([]);
  const pendingFocusIntentRef = useRef(null);

  const [show, setShow] = useState(defaultShow);
  const [buttonRef, setButtonRef] = useState(null);

  const closeMenu = useCallback(() => {
    setShow(false);

    buttonRef?.focus();
  }, [buttonRef]);

  const openMenu = useCallback((focusIntent = null) => {
    pendingFocusIntentRef.current = focusIntent;

    setShow(true);
  }, []);

  const registerOption = useCallback((nodeRef, disabled) => {
    const option = { nodeRef, disabled };
    optionsRef.current = [...optionsRef.current, option];

    return () => {
      optionsRef.current = optionsRef.current.filter((registered) => registered !== option);
    };
  }, []);

  const enabledOptions = useCallback(
    () => optionsRef.current.filter((option) => !option.disabled && option.nodeRef.current),
    []
  );

  const focusFirstOption = useCallback(
    () => enabledOptions().some((option) => focusItemNode(option.nodeRef.current)),
    [enabledOptions],
  );

  const focusLastOption = useCallback(
    () => enabledOptions().reverse().some((option) => focusItemNode(option.nodeRef.current)),
    [enabledOptions],
  );

  const focusNextOption = useCallback(() => {
    const options = enabledOptions();

    const currentIndex = options.findIndex(
      (option) => option.nodeRef.current === document.activeElement
        || option.nodeRef.current.contains(document.activeElement)
    );

    // Options after the current one, then wrap around to the options before
    // (and including) it. When no option is focused start at the first option.
    [...options.slice(currentIndex + 1), ...options.slice(0, currentIndex + 1)]
      .some((option) => focusItemNode(option.nodeRef.current));
  }, [enabledOptions]);

  const focusPreviousOption = useCallback(() => {
    const options = enabledOptions();

    const currentIndex = Math.max(0, options.findIndex(
      (option) => option.nodeRef.current === document.activeElement
        || option.nodeRef.current.contains(document.activeElement)
    ));

    // Options before the current one, then wrap around to the options after
    // (and including) it, both walked backwards. When no option is focused start
    // at the last option.
    [...options.slice(0, currentIndex).reverse(), ...options.slice(currentIndex).reverse()]
      .some((option) => focusItemNode(option.nodeRef.current));
  }, [enabledOptions]);

  const onKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      if (show) {
        focusNextOption();
      } else {
        openMenu(FOCUS_INTENT_FIRST);
      }

      break;

    case 'ArrowUp':
      event.preventDefault();

      if (show) {
        focusPreviousOption();
      } else {
        openMenu(FOCUS_INTENT_LAST);
      }

      break;

    case 'End':
      if (show) {
        event.preventDefault();

        focusLastOption();
      }

      break;

    case 'Home':
      if (show) {
        event.preventDefault();

        focusFirstOption();
      }

      break;

    case 'Tab':
      if (show) {
        closeMenu();
      }

      break;

    case 'Escape':
      if (show) {
        event.preventDefault();
        event.stopPropagation();

        closeMenu();
      }

      break;

    default:
    }
  };

  useEffect(() => {
    if (show && pendingFocusIntentRef.current) {
      const focusIntent = pendingFocusIntentRef.current;
      pendingFocusIntentRef.current = null;

      if (focusIntent === FOCUS_INTENT_FIRST) {
        focusFirstOption();
      } else if (focusIntent === FOCUS_INTENT_LAST) {
        focusLastOption();
      }
    }
  }, [focusFirstOption, focusLastOption, show]);

  const onToggleClick = (event) => {
    if (show) {
      setShow(false);
    } else {
      // A click with no detail is keyboard-driven. Focus the first option.
      openMenu(event.detail === 0 ? FOCUS_INTENT_FIRST : null);
    }
  };

  const menuContextValue = useMemo(() => ({ closeMenu, registerOption }), [closeMenu, registerOption]);

  const toggleStyle = useMemo(() => ({
    ...(backgroundColor ? { '--kebab-menu-background-color': backgroundColor } : null),
    ...(dotColor ? { '--kebab-menu-dot-color': dotColor } : null),
    ...(size ? { '--kebab-menu-size': size } : null),
  }), [backgroundColor, dotColor, size]);

  return (
    <div className={`${styles.kebabMenu} ${className}`} onKeyDown={onKeyDown} {...rest}>
      <button
        aria-controls={menuId}
        aria-expanded={show}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={styles.toggle}
        onClick={onToggleClick}
        ref={setButtonRef}
        style={toggleStyle}
        title={title}
        type="button"
      >
        <span aria-hidden="true" className={styles.dots} />
      </button>

      <Overlay
        onHide={closeMenu}
        placement={align === 'end' ? 'bottom-end' : 'bottom-start'}
        rootClose
        show={show}
        target={buttonRef}
      >
        <Popover className={styles.menuPopover} ref={ref}>
          <MenuContext.Provider value={menuContextValue}>
            <ul
              aria-label={ariaLabel}
              className={styles.menu}
              id={menuId}
              role="menu"
            >
              {children}
            </ul>
          </MenuContext.Provider>
        </Popover>
      </Overlay>
    </div>
  );
};

KebabMenu.Option = Option;
KebabMenu.Divider = Divider;

export default KebabMenu;
