import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled):not([tabindex="-1"])',
  'input:not(:disabled):not([type="hidden"]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const findPopover = (body) => body.closest('[role="dialog"]');

const isPlainPrimaryClick = (event) => event.button === 0
  && !event.altKey
  && !event.ctrlKey
  && !event.metaKey
  && !event.shiftKey;

// Tab reaches a radio group only through its checked radio, or its first one
// while none is checked, so the rest are left out of the loop.
const isTabStop = (element, focusableElements) => {
  if (element.type === 'radio') {
    const groupRadios = focusableElements.filter((focusableElement) => focusableElement.type === 'radio'
      && focusableElement.name === element.name);

    return element.checked || (!groupRadios.some((groupRadio) => groupRadio.checked) && groupRadios[0] === element);
  }

  return true;
};

const useModalPopover = (bodyRef, trigger, onClose, isNestedMenuOpen = false) => {
  const focusPopover = () => findPopover(bodyRef.current).focus();

  // A popover opens in a portal out of the tab order, so focus is sent to the
  // popover itself: no field raises a keyboard and no button takes the Enter.
  useEffect(() => {
    findPopover(bodyRef.current).focus();
  }, [bodyRef]);

  // Like rootClose, only a plain click that starts and ends outside closes it,
  // and the trigger is left to toggle the popover itself.
  useEffect(() => {
    const isOutside = (target) => !findPopover(bodyRef.current).contains(target) && !trigger.contains(target);

    let hasPressStartedOutside = false;

    const onPointerDown = (event) => {
      hasPressStartedOutside = isOutside(event.target);
    };

    const onClick = (event) => {
      if (hasPressStartedOutside && isPlainPrimaryClick(event) && isOutside(event.target)) {
        onClose();
      }

      hasPressStartedOutside = false;
    };

    // Captured, so a target is judged before a click inside can unmount it.
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [bodyRef, onClose, trigger]);

  const onKeyDown = (event) => {
    switch (event.key) {
    // An Escape that closes a nested menu leaves the popover open.
    case 'Escape':
      if (!isNestedMenuOpen) {
        event.preventDefault();

        onClose();

        trigger.focus();
      }

      break;

    // Focus resting on the popover itself sits outside the loop, so either key
    // brings it back in at the matching end.
    case 'Tab': {
      const focusableElements = [...bodyRef.current.querySelectorAll(FOCUSABLE_SELECTOR)];
      const tabStops = focusableElements.filter((element) => isTabStop(element, focusableElements));
      const focusedTabStopIndex = tabStops.indexOf(document.activeElement);

      if (event.shiftKey && focusedTabStopIndex <= 0) {
        event.preventDefault();

        tabStops.at(-1).focus();
      } else if (!event.shiftKey && [-1, tabStops.length - 1].includes(focusedTabStopIndex)) {
        event.preventDefault();

        tabStops[0].focus();
      }

      break;
    }

    default:
    }
  };

  return { focusPopover, onKeyDown };
};

export default useModalPopover;
