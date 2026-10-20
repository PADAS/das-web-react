import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import { FOCUSABLE_SELECTOR } from '../constants';

import * as styles from './styles.module.scss';

export const FOCUS_INTENTS = { FIRST_OPTION: 'firstOption', LAST_OPTION: 'lastOption', MENU: 'menu' };

const POINT_OFFSET = [0, 0];

const MenuContext = createContext(null);

const focusItemNode = (node) => {
  const focusable = node?.matches(FOCUSABLE_SELECTOR) ? node : node?.querySelector(FOCUSABLE_SELECTOR);

  focusable?.focus();

  // Returns whether focus actually landed.
  return !!focusable && document.activeElement === focusable;
};

// Popper places an overlay against anything that reports a bounding rectangle.
const getPointAnchor = (point) => ({
  getBoundingClientRect: () => ({
    bottom: point.y,
    height: 0,
    left: point.x,
    right: point.x,
    top: point.y,
    width: 0,
    x: point.x,
    y: point.y,
  }),
});

const Option = ({
  as: Component = 'button',
  children,
  className = '',
  disabled = false,
  onClick,
  ref,
  ...otherProps
}) => {
  const { closeMenu, registerOption } = useContext(MenuContext);

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
      {...otherProps}
    >
      {children}
    </Component>
  </li>;
};

const Divider = ({ className = '' }) => <li
  aria-orientation="horizontal"
  className={`${styles.divider} ${className}`}
  role="separator"
/>;

const Menu = ({
  anchor,
  'aria-label': ariaLabel,
  children,
  focusIntent = FOCUS_INTENTS.MENU,
  id,
  onClose,
  onHide,
  placement = 'bottom-start',
  shouldHideOnScroll = false,
  show,
}) => {
  const listRef = useRef(null);
  const optionsRef = useRef([]);
  const popoverRef = useRef(null);

  const isAnchoredToPoint = !!anchor && !(anchor instanceof Element);

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

  const registerOption = useCallback((nodeRef, disabled) => {
    const option = { disabled, nodeRef };
    optionsRef.current = [...optionsRef.current, option];

    return () => {
      optionsRef.current = optionsRef.current.filter((registered) => registered !== option);
    };
  }, []);

  const menuContextValue = useMemo(() => ({ closeMenu: onClose, registerOption }), [onClose, registerOption]);

  // Popper takes a new anchor as a new target to wait for, so a point keeps
  // its identity across renders.
  const target = useMemo(() => isAnchoredToPoint ? getPointAnchor(anchor) : anchor, [anchor, isAnchoredToPoint]);

  const focusNextOption = () => {
    const options = enabledOptions();

    const currentIndex = options.findIndex(
      (option) => option.nodeRef.current === document.activeElement
        || option.nodeRef.current.contains(document.activeElement)
    );

    // Options after the current one, then wrap around to the options before
    // (and including) it. When no option is focused start at the first option.
    [...options.slice(currentIndex + 1), ...options.slice(0, currentIndex + 1)]
      .some((option) => focusItemNode(option.nodeRef.current));
  };

  const focusPreviousOption = () => {
    const options = enabledOptions();

    const currentIndex = Math.max(0, options.findIndex(
      (option) => option.nodeRef.current === document.activeElement
        || option.nodeRef.current.contains(document.activeElement)
    ));

    // Walks backwards from the current option, wrapping, or from the last one.
    [...options.slice(0, currentIndex).reverse(), ...options.slice(currentIndex).reverse()]
      .some((option) => focusItemNode(option.nodeRef.current));
  };

  const onKeyDown = (event) => {
    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      focusNextOption();

      break;

    case 'ArrowUp':
      event.preventDefault();

      focusPreviousOption();

      break;

    case 'End':
      event.preventDefault();

      focusLastOption();

      break;

    case 'Escape':
      event.preventDefault();

      onClose();

      break;

    case 'Home':
      event.preventDefault();

      focusFirstOption();

      break;

    case 'Tab':
      onClose();

      break;

    default:
    }
  };

  // A menu moved to a new anchor takes focus again, as one opened there would.
  useEffect(() => {
    if (show) {
      if (focusIntent === FOCUS_INTENTS.FIRST_OPTION) {
        focusFirstOption();
      } else if (focusIntent === FOCUS_INTENTS.LAST_OPTION) {
        focusLastOption();
      } else {
        listRef.current?.focus({ preventScroll: true });
      }
    }
  }, [focusFirstOption, focusIntent, focusLastOption, show, target]);

  useEffect(() => {
    if (show) {
      // Root close ignores right clicks, which would leave this menu open beside
      // the one the next right click opens.
      const onDocumentContextMenu = (event) => {
        if (!popoverRef.current?.contains(event.target)) {
          onHide();
        }
      };

      document.addEventListener('contextmenu', onDocumentContextMenu, true);

      return () => document.removeEventListener('contextmenu', onDocumentContextMenu, true);
    }
  }, [onHide, show]);

  useEffect(() => {
    if (show && shouldHideOnScroll) {
      // Scroll events do not bubble, so only a capture listener hears them all.
      const onDocumentScroll = (event) => {
        if (!popoverRef.current?.contains(event.target)) {
          onHide();
        }
      };

      document.addEventListener('scroll', onDocumentScroll, true);

      return () => document.removeEventListener('scroll', onDocumentScroll, true);
    }
  }, [onHide, shouldHideOnScroll, show]);

  return <Overlay
    flip
    offset={isAnchoredToPoint ? POINT_OFFSET : undefined}
    onHide={onHide}
    placement={placement}
    ref={popoverRef}
    rootClose
    show={show}
    target={target}
  >
    <Popover className={styles.menuPopover}>
      <MenuContext.Provider value={menuContextValue}>
        <ul
          aria-label={ariaLabel}
          className={styles.menu}
          id={id}
          onKeyDown={onKeyDown}
          ref={listRef}
          role="menu"
          tabIndex={-1}
        >
          {children}
        </ul>
      </MenuContext.Provider>
    </Popover>
  </Overlay>;
};

Menu.Divider = Divider;
Menu.Option = Option;

export default Menu;
