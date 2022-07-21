import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import useOnScreen from '../../hooks/useOnScreen';

import styles from './styles.module.scss';

export const QuickLinksContext = createContext();

const QuickLinks = ({ children, scrollTopOffset }) => {
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

QuickLinks.defaultProps = { scrollTopOffset: 0, sectionWrapperRef: null };

QuickLinks.propTypes = {
  children: PropTypes.node.isRequired,
  scrollTopOffset: PropTypes.number,
  sectionWrapperRef: PropTypes.shape({
    current: PropTypes.any,
  }),
};


const NavigationBar = ({ children }) => <div
  className={styles.navigationBar}
  data-testid="reportDetailView-quickLinks-navigationBar"
  >
  {children}
</div>;

NavigationBar.propTypes = { children: PropTypes.node.isRequired };

QuickLinks.NavigationBar = NavigationBar;


const Anchor = ({ anchorTitle, iconComponent }) => {
  const { getSectionElement, onClickAnchor } = useContext(QuickLinksContext);

  const sectionElement = useMemo(() => getSectionElement(anchorTitle), [anchorTitle, getSectionElement]);

  const isSectionOnScreen = useOnScreen(sectionElement);

  const onClick = useCallback(() => onClickAnchor(anchorTitle), [onClickAnchor, anchorTitle]);

  return sectionElement ? <div
    className={`${styles.anchor} ${isSectionOnScreen ? 'active' : ''}`}
    data-testid={`reportDetailView-quickLinks-anchor-${anchorTitle}`}
    onClick={onClick}
    >
    {iconComponent}
    <span>{anchorTitle}</span>
  </div> : null;
};

Anchor.propTypes = { anchorTitle: PropTypes.string.isRequired, iconComponent: PropTypes.node.isRequired };

QuickLinks.Anchor = Anchor;


const SectionsWrapper = ({ children }) => {
  const { sectionsWrapperRef } = useContext(QuickLinksContext);

  return <div
    className={styles.sectionsWrapper}
    data-testid="reportDetailView-quickLinks-anchor-sectionsWrapper"
    ref={sectionsWrapperRef}
    >
    {children}
  </div>;
};

SectionsWrapper.propTypes = { children: PropTypes.node.isRequired };

QuickLinks.SectionsWrapper = SectionsWrapper;


const Section = ({ anchorTitle, children, hidden }) => {
  const { getSectionElement, onSectionElementChange } = useContext(QuickLinksContext);

  const [sectionElement, setSectionElement] = useState();

  const sectionRef = useCallback((element) => setSectionElement(element), []);

  useEffect(() => {
    if (getSectionElement(anchorTitle) !== sectionElement) {
      onSectionElementChange(anchorTitle, sectionElement);
    }
  }, [anchorTitle, getSectionElement, onSectionElementChange, sectionElement]);

  return !hidden ? <div data-testid={`reportDetailView-quickLinks-section-${anchorTitle}`} ref={sectionRef}>
    {children}
  </div> : null;
};

Section.defaultProps = { hidden: false };

Section.propTypes = {
  anchorTitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  hidden: PropTypes.bool,
};

QuickLinks.Section = Section;


export default QuickLinks;
