import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import useOnScreen from '../../hooks/useOnScreen';

import styles from './styles.module.scss';

const QuickLinkAnchors = ({
  activitySectionElement,
  detailsSectionElement,
  historySectionElement,
  onScrollToSection,
}) => {
  const isActivitySectionOnScreen = useOnScreen(activitySectionElement);
  const isDetailsSectionOnScreen = useOnScreen(detailsSectionElement);
  const isHistorySectionOnScreen = useOnScreen(historySectionElement);

  const isDetailAnchorActive = isDetailsSectionOnScreen;
  const isActivityAnchorActive = !isDetailsSectionOnScreen && isActivitySectionOnScreen;
  const isHistoryAnchorActive = !isDetailsSectionOnScreen && !isActivitySectionOnScreen && isHistorySectionOnScreen;

  const onClickAnchor = useCallback((sectionElement) => () => {
    onScrollToSection(sectionElement);
  }, [onScrollToSection]);

  return <div className={styles.navigationBar}>
    {detailsSectionElement && <div
      className={`${styles.anchor} ${isDetailAnchorActive ? 'active' : ''}`}
      data-testid="reportDetailView-quickLinkAnchors-detailsAnchor"
      onClick={onClickAnchor(detailsSectionElement)}
    >
      <PencilWritingIcon />
      <span>Details</span>
    </div>}

    {activitySectionElement && <div
      className={`${styles.anchor} ${isActivityAnchorActive ? 'active' : ''}`}
      data-testid="reportDetailView-quickLinkAnchors-activityAnchor"
      onClick={onClickAnchor(activitySectionElement)}
    >
      <BulletListIcon />
      <span>Activity</span>
    </div>}

    {historySectionElement && <div
      className={`${styles.anchor} ${isHistoryAnchorActive ? 'active' : ''}`}
      data-testid="reportDetailView-quickLinkAnchors-historyAnchor"
      onClick={onClickAnchor(historySectionElement)}
    >
      <HistoryIcon />
      <span>History</span>
    </div>}
  </div>;
};

QuickLinkAnchors.defaultProps = {
  activitySectionElement: null,
  detailsSectionElement: null,
  historySectionElement: null,
};

QuickLinkAnchors.propTypes = {
  activitySectionElement: PropTypes.instanceOf(Element),
  detailsSectionElement: PropTypes.instanceOf(Element),
  historySectionElement: PropTypes.instanceOf(Element),
  onScrollToSection: PropTypes.func.isRequired,
};

export default memo(QuickLinkAnchors);
