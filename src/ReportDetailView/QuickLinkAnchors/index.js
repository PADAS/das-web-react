import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import styles from './styles.module.scss';

const QuickLinkAnchors = ({ activitySectionNode, detailsSectionNode, historySectionNode, onScrollToSection }) => {
  const intersectionObserversRef = useRef([]);

  const [isActivitySectionOnScreen, setIsActivitySectionOnScreen] = useState(false);
  const [isDetailsSectionOnScreen, setIsDetailsSectionOnScreen] = useState(false);
  const [isHistorySectionOnScreen, setIsHistorySectionOnScreen] = useState(false);

  const setIntersectionObserver = useCallback((setIsSectionOnScreen, sectionNode) => {
    if (!!sectionNode) {
      const observer = new IntersectionObserver(([entry]) => setIsSectionOnScreen(entry.isIntersecting));
      observer.observe(sectionNode);

      intersectionObserversRef.current.push(observer);
    } else {
      setIsSectionOnScreen(false);
    }
  }, []);

  useEffect(() => {
    setIntersectionObserver(setIsActivitySectionOnScreen, activitySectionNode);
  }, [activitySectionNode, setIntersectionObserver]);

  useEffect(() => {
    setIntersectionObserver(setIsDetailsSectionOnScreen, detailsSectionNode);
  }, [detailsSectionNode, setIntersectionObserver]);

  useEffect(() => {
    setIntersectionObserver(setIsHistorySectionOnScreen, historySectionNode);
  }, [historySectionNode, setIntersectionObserver]);

  useEffect(() => () => intersectionObserversRef.current.forEach((observer) => observer.disconnect()), []);

  const isDetailAnchorActive = isDetailsSectionOnScreen;
  const isActivityAnchorActive = !isDetailsSectionOnScreen && isActivitySectionOnScreen;
  const isHistoryAchorActive = !isDetailsSectionOnScreen && !isActivitySectionOnScreen && isHistorySectionOnScreen;

  return <div className={styles.navigationBar}>
    {detailsSectionNode && <div
      className={`${styles.anchor} ${isDetailAnchorActive ? 'active' : ''}`}
      onClick={onScrollToSection(detailsSectionNode)}
    >
      <PencilWritingIcon />
      <span>Details</span>
    </div>}

    {activitySectionNode && <div
      className={`${styles.anchor} ${isActivityAnchorActive ? 'active' : ''}`}
      onClick={onScrollToSection(activitySectionNode)}
    >
      <BulletListIcon />
      <span>Activity</span>
    </div>}

    {historySectionNode && <div
      className={`${styles.anchor} ${isHistoryAchorActive ? 'active' : ''}`}
      onClick={onScrollToSection(historySectionNode)}
    >
      <HistoryIcon />
      <span>History</span>
    </div>}
  </div>;
};

QuickLinkAnchors.defaultProps = {
  activitySectionNode: null,
  detailsSectionNode: null,
  historySectionNode: null,
};

QuickLinkAnchors.propTypes = {
  activitySectionNode: PropTypes.instanceOf(Element),
  detailsSectionNode: PropTypes.instanceOf(Element),
  historySectionNode: PropTypes.instanceOf(Element),
  onScrollToSection: PropTypes.func.isRequired,
};

export default memo(QuickLinkAnchors);
