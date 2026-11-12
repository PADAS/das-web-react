import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as CheckIcon } from '../common/images/icons/check-light.svg';

import { FOCUSABLE_SELECTOR } from '../constants';

import * as styles from './styles.module.scss';

export const FOCUS_INTENTS = { FIRST_OPTION: 'firstOption', LAST_OPTION: 'lastOption', MENU: 'menu' };

const CHECKABLE_ROLES = new Set(['menuitemcheckbox', 'menuitemradio']);

const POINT_OFFSET = [0, 0];

const MenuContext = createContext(null);

const findFocusedOptionIndex = (options) => options.findIndex(
  (option) => option.nodeRef.current === document.activeElement
    || option.nodeRef.current.contains(document.activeElement)
);

const focusItemNode = (node) => {
  const focusable = node?.matches(FOCUSABLE_SELECTOR) ? node : node?.querySelector(FOCUSABLE_SELECTOR);

  focusable?.focus();

  // Returns whether focus actually landed.
  return !!focusable && document.activeElement === focusable;
};

const isBeforeInDocument = (node, otherNode) => !!(node.compareDocumentPosition(otherNode)
  & Node.DOCUMENT_POSITION_FOLLOWING);

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
  'aria-checked': ariaChecked,
  'aria-current': ariaCurrent,
  as: Component = 'button',
  children,
  className = '',
  disabled = false,
  onClick,
  ref,
  role = 'menuitem',
  ...otherProps
}) => {
  const { closeMenu, registerOption } = useContext(MenuContext);

  const nodeRef = useRef(null);

  const isButton = Component === 'button';
  const isMarked = CHECKABLE_ROLES.has(role) ? !!ariaChecked : !!ariaCurrent;

  const onClickOption = (event) => {
    if (disabled) {
      event.preventDefault();
    } else {
      onClick?.(event);

      // A checkbox toggles in place, so several can change in one visit.
      if (role !== 'menuitemcheckbox') {
        closeMenu(event);
      }
    }
  };

  const setNode = useCallback((node) => {
    nodeRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  useEffect(() => {
    const unregisterOption = registerOption(nodeRef, disabled);

    return () => unregisterOption?.();
  }, [disabled, registerOption]);

  return <li className={styles.item} role="none">
    <Component
      aria-checked={ariaChecked}
      aria-current={ariaCurrent}
      aria-disabled={!isButton && disabled ? true : undefined}
      className={`${styles.itemBtn} ${className}`}
      disabled={isButton ? disabled : undefined}
      onClick={onClickOption}
      ref={setNode}
      role={role}
      tabIndex={-1}
      type={isButton ? 'button' : undefined}
      {...otherProps}
    >
      {isMarked && <CheckIcon
        aria-hidden="true"
        className={styles.checkIcon}
        data-testid="menu-checkIcon"
      />}

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
  className = '',
  focusIntent = FOCUS_INTENTS.MENU,
  header = null,
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

  // Options register as they mount, so one that moves keeps its old place in
  // the registry: the document order is the one the user sees.
  const getEnabledOptions = useCallback(
    () => optionsRef.current
      .filter((option) => !option.disabled && option.nodeRef.current)
      .sort((option, otherOption) => isBeforeInDocument(otherOption.nodeRef.current, option.nodeRef.current) ? 1 : -1),
    []
  );

  const focusFirstOption = useCallback(
    () => getEnabledOptions().some((option) => focusItemNode(option.nodeRef.current)),
    [getEnabledOptions],
  );

  const focusLastOption = useCallback(
    () => getEnabledOptions().reverse().some((option) => focusItemNode(option.nodeRef.current)),
    [getEnabledOptions],
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
    const options = getEnabledOptions();
    const currentIndex = findFocusedOptionIndex(options);

    // Options after the current one, then wrap around to the options before
    // (and including) it. When no option is focused start at the first option.
    [...options.slice(currentIndex + 1), ...options.slice(0, currentIndex + 1)]
      .some((option) => focusItemNode(option.nodeRef.current));
  };

  const focusPreviousOption = () => {
    const options = getEnabledOptions();
    const currentIndex = Math.max(0, findFocusedOptionIndex(options));

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
    <Popover className={`${styles.menuPopover} ${className}`} role="presentation">
      {!!header && <div aria-hidden="true" className={styles.header}>{header}</div>}

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
