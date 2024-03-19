const getScrollContainerTopAndBottom = (container) => ({ top: container.scrollTop, bottom: container.scrollTop + container.clientHeight });

const getElementScrollPosition = (element, heightToAdd, padding = 20) => ({ top: element.offsetTop, bottom: (element.offsetTop + element.clientHeight + heightToAdd + padding) });

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