import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import useOnScreen from '../hooks/useOnScreen';

import * as styles from './styles.module.scss';

export const QuickLinksContext = createContext();

const QuickLinks = ({ children, scrollTopOffset = 0 }) => {
  const sectionsWrapperRef = useRef();

  const [sectionElements, setSectionElements] = useState({});

  const onClickAnchor = useCallback((anchorTitle) => {
    if (sectionElements[anchorTitle] && sectionsWrapperRef?.current) {
      sectionsWrapperRef.current.scrollTo({
        top: sectionElements[anchorTitle].offsetTop - scrollTopOffset,
        behavior: 'smooth',
      });
    }
  }, [scrollTopOffset, sectionElements, sectionsWrapperRef]);

  const getSectionElement = useCallback((anchorTitle) => sectionElements[anchorTitle], [sectionElements]);

  const onSectionElementChange = useCallback((anchorTitle, sectionElement) => {
    setSectionElements({ ...sectionElements, [anchorTitle]: sectionElement });
  }, [sectionElements]);

  const quickLinksContextValue = { getSectionElement, onClickAnchor, onSectionElementChange, sectionsWrapperRef };

  return <QuickLinksContext.Provider value={quickLinksContextValue}>
    {children}
  </QuickLinksContext.Provider>;
};


const NavigationBar = ({ children, className = '' }) => <div
  className={`${styles.navigationBar} ${className}`}
  data-testid="quickLinks-navigationBar"
  >
  {children}
</div>;

QuickLinks.NavigationBar = NavigationBar;


const Anchor = ({ anchorTitle, onClick: onClickCallback = null, iconComponent }) => {
  const { getSectionElement, onClickAnchor } = useContext(QuickLinksContext);

  const sectionElement = useMemo(() => getSectionElement(anchorTitle), [anchorTitle, getSectionElement]);

  const isSectionOnScreen = useOnScreen(sectionElement);

  const onClick = useCallback((event) => {
    onClickAnchor(anchorTitle);

    onClickCallback?.(event);
  }, [onClickAnchor, onClickCallback, anchorTitle]);

  return sectionElement ? <div
    className={`${styles.anchor} ${isSectionOnScreen ? 'active' : ''}`}
    data-testid={`quickLinks-anchor-${anchorTitle}`}
    onClick={onClick}
    >
    {iconComponent}
    <span>{anchorTitle}</span>
  </div> : null;
};

QuickLinks.Anchor = Anchor;


const SectionsWrapper = ({ className = '', children }) => {
  const { sectionsWrapperRef } = useContext(QuickLinksContext);

  return <div
    className={`${styles.sectionsWrapper} ${className}`}
    data-testid="quickLinks-anchor-sectionsWrapper"
    ref={sectionsWrapperRef}
    >
    {children}
  </div>;
};

QuickLinks.SectionsWrapper = SectionsWrapper;


const Section = ({ anchorTitle, className = '', children, hidden = false }) => {
  const { getSectionElement, onSectionElementChange } = useContext(QuickLinksContext);

  const [sectionElement, setSectionElement] = useState();

  const sectionRef = useCallback((element) => setSectionElement(element), []);

  useEffect(() => {
    if (getSectionElement(anchorTitle) !== sectionElement) {
      onSectionElementChange(anchorTitle, sectionElement);
    }
  }, [anchorTitle, getSectionElement, onSectionElementChange, sectionElement]);

  return !hidden ? <div className={className} data-testid={`quickLinks-section-${anchorTitle}`} ref={sectionRef}>
    {children}
  </div> : null;
};

QuickLinks.Section = Section;


export default QuickLinks;
