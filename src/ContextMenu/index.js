import { useCallback, useImperativeHandle, useRef, useState } from 'react';

import { FOCUSABLE_SELECTOR } from '../constants';

import Menu, { FOCUS_INTENTS } from '../Menu';

const isPointWithinRect = (point, rect) => point.x >= rect.left
  && point.x <= rect.right
  && point.y >= rect.top
  && point.y <= rect.bottom;

const ContextMenu = ({ 'aria-label': ariaLabel, children, isLoading = false, ref }) => {
  const returnFocusRef = useRef(null);

  const [anchor, setAnchor] = useState(null);
  const [show, setShow] = useState(false);

  // Only the context menu key anchors the menu to an element, and a keyboard
  // user expects to land on an option.
  const isOpenedFromKeyboard = anchor instanceof Element;

  const hideMenu = useCallback(() => setShow(false), []);

  const closeMenu = useCallback(() => {
    hideMenu();

    returnFocusRef.current?.focus({ preventScroll: true });
  }, [hideMenu]);

  useImperativeHandle(ref, () => ({
    open: (contextMenuEvent) => {
      contextMenuEvent.preventDefault();

      // The menu takes no new action while the one it started is still running.
      if (!isLoading) {
        const point = { x: contextMenuEvent.clientX, y: contextMenuEvent.clientY };

        // The context menu key reports no pointer over the area that listens.
        const isFromPointer = isPointWithinRect(point, contextMenuEvent.currentTarget.getBoundingClientRect());

        const focusedElement = document.activeElement;

        // A click leaves focus on the page, and focus in a menu leaves with it,
        // so a reopened menu keeps its target and a new one takes the area's.
        returnFocusRef.current = !!focusedElement
          && focusedElement !== document.body
          && !focusedElement.closest('[role="menu"]')
          ? focusedElement
          : (show ? returnFocusRef.current : null) ?? contextMenuEvent.currentTarget.querySelector(FOCUSABLE_SELECTOR);

        setAnchor(isFromPointer ? point : contextMenuEvent.target);
        setShow(true);
      }
    },
  }), [isLoading, show]);

  // The point it opened at belongs to no element, so it means nothing once
  // anything scrolls.
  return <Menu
    anchor={anchor}
    aria-label={ariaLabel}
    focusIntent={isOpenedFromKeyboard ? FOCUS_INTENTS.FIRST_OPTION : FOCUS_INTENTS.MENU}
    onClose={closeMenu}
    onHide={hideMenu}
    shouldHideOnScroll
    show={show}
  >
    {children}
  </Menu>;
};

export default ContextMenu;
