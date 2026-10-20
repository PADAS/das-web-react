import { useCallback, useImperativeHandle, useRef, useState } from 'react';

import Menu from '../Menu';

const isPointWithinRect = (point, rect) => point.x >= rect.left
  && point.x <= rect.right
  && point.y >= rect.top
  && point.y <= rect.bottom;

const ContextMenu = ({ 'aria-label': ariaLabel, children, isLoading = false, ref }) => {
  const returnFocusRef = useRef(null);

  const [anchor, setAnchor] = useState(null);
  const [show, setShow] = useState(false);

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

        returnFocusRef.current = document.activeElement;

        setAnchor(isFromPointer ? point : contextMenuEvent.target);
        setShow(true);
      }
    },
  }), [isLoading]);

  // The point it opened at belongs to no element, so it means nothing once
  // anything scrolls.
  return <Menu
    anchor={anchor}
    aria-label={ariaLabel}
    onClose={closeMenu}
    onHide={hideMenu}
    shouldHideOnScroll
    show={show}
  >
    {children}
  </Menu>;
};

export default ContextMenu;
