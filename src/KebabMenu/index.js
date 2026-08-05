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

const FOCUSABLE_SELECTOR = 'button:not(:disabled), a[href]';

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

  const onClickOption = (event) => {
    if (!disabled) {
      onClick?.(event);

      closeMenu(event);
    }
  };

  const onMouseEnter = useCallback(() => {
    if (!disabled) {
      focusItemNode(nodeRef.current);
    }
  }, [disabled]);

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
    {Component === 'button'
      ? <button
          className={`${styles.itemBtn} ${className}`}
          disabled={disabled}
          onClick={onClickOption}
          onMouseEnter={onMouseEnter}
          ref={setNode}
          role="menuitem"
          tabIndex={-1}
          type="button"
          {...rest}
        >
        {children}
      </button>
      : <div
          className={`${styles.itemBtn} ${className}`}
          onClick={onClickOption}
          onMouseEnter={onMouseEnter}
          ref={setNode}
          {...rest}
        >
        {children}
      </div>}
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

  const [show, setShow] = useState(defaultShow);
  const [buttonRef, setButtonRef] = useState(null);

  const closeMenu = useCallback(() => {
    setShow(false);

    buttonRef?.focus();
  }, [buttonRef]);

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
    () => enabledOptions().toReversed().some((option) => focusItemNode(option.nodeRef.current)),
    [enabledOptions],
  );

  const focusNextOption = useCallback(() => {
    const options = enabledOptions();

    const currentIndex = options.findIndex(
      (option) => option.nodeRef.current === document.activeElement
        || option.nodeRef.current.contains(document.activeElement)
    );

    // Options after the current one, then wrap around to the options before
    // (and including) it.
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
    // (and including) it, both walked backwards.
    [...options.slice(0, currentIndex).toReversed(), ...options.slice(currentIndex).toReversed()]
      .some((option) => focusItemNode(option.nodeRef.current));
  }, [enabledOptions]);

  const onMenuKeyDown = (event) => {
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

    case 'Home':
      event.preventDefault();

      focusFirstOption();

      break;

    case 'Tab':
    case 'Escape':
      event.preventDefault();

      closeMenu();

      break;

    default:
    }
  };

  useEffect(() => {
    if (show) {
      focusFirstOption();
    }
  }, [focusFirstOption, show]);

  const menuContextValue = useMemo(() => ({ closeMenu, registerOption }), [closeMenu, registerOption]);

  const toggleStyle = {
    ...(backgroundColor ? { '--kebab-menu-background-color': backgroundColor } : null),
    ...(dotColor ? { '--kebab-menu-dot-color': dotColor } : null),
    ...(size ? { '--kebab-menu-size': size } : null),
  };

  return (
    <div className={`${styles.kebabMenu} ${className}`} {...rest}>
      <button
        aria-controls={menuId}
        aria-expanded={show}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={styles.toggle}
        onClick={() => setShow((currentShow) => !currentShow)}
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
        <Popover className={styles.menuPopover} id={menuId} ref={ref}>
          <MenuContext.Provider value={menuContextValue}>
            <ul
              aria-label={ariaLabel}
              className={styles.menu}
              onKeyDown={onMenuKeyDown}
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
