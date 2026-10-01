const FOCUS_TARGET_INDEX_BY_KEY = {
  ArrowDown: (currentIndex, optionCount) => (currentIndex + 1) % optionCount,
  ArrowUp: (currentIndex, optionCount) => (currentIndex - 1 + optionCount) % optionCount,
  End: (_, optionCount) => optionCount - 1,
  Home: () => 0,
};

const navigateMenuWithKeyboard = (event, optionNodes, closeMenu) => {
  const getFocusTargetIndex = FOCUS_TARGET_INDEX_BY_KEY[event.key];

  if (getFocusTargetIndex) {
    event.preventDefault();

    const currentIndex = optionNodes.findIndex((optionNode) => optionNode === document.activeElement);

    optionNodes[getFocusTargetIndex(currentIndex, optionNodes.length)]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();

    closeMenu();
  } else if (event.key === 'Tab') {
    // The default action is left alone so focus moves on, but it returns to the
    // toggle first: the menu unmounting would drop it to the document top.
    closeMenu();
  }
};

export default navigateMenuWithKeyboard;
