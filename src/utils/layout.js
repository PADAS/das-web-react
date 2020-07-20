const getScrollContainerTopAndBottom = (container) => ({ top: container.scrollTop, bottom: container.scrollTop + container.clientHeight });

const getElementScrollPosition = (element, heightToAdd, padding = 20) => ({ top: element.offsetTop, bottom: (element.offsetTop + element.clientHeight + heightToAdd + padding) });

export const elementIsInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const getElementPositionDataWithinScrollContainer = (container, element, heightToAdd, padding = 20) => {
  const { top: cTop, bottom: cBottom } = getScrollContainerTopAndBottom(container);
  const { top: eTop, bottom: eBottom } = getElementScrollPosition(element, heightToAdd, padding);

  const isAboveFold = eTop < cTop;
  const isBelowFold = eBottom > cBottom;
  const isFullyVisible = !isAboveFold && !isBelowFold;

  return {
    isAboveFold,
    isBelowFold,
    isFullyVisible,
    eTop, eBottom,
    cTop, cBottom,
  };
};