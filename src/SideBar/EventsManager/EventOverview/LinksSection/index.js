import { memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LinkIcon } from '../../../../common/images/icons/link.svg';

import { LINK_TYPES, TAB_KEYS } from '../../../../constants';
import { selectEventLinkPermissions } from '../../../../selectors/event-links';

import LinkItem from './LinkItem';

import * as styles from './styles.module.scss';

const EMPTY_LINKED_ITEMS = [];

const LinksSection = ({
  headingRef = null,
  isChangingLinks = false,
  linkedPatrols = EMPTY_LINKED_ITEMS,
  linkedReports = EMPTY_LINKED_ITEMS,
  onRemoveFromIncident = null,
  onRemoveFromPatrol = null,
  report,
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

  const eventLinkPermissions = useSelector((state) => selectEventLinkPermissions(state, report));

  const [removingLinkId, setRemovingLinkId] = useState(null);

  const removeLink = async (linkId, remove) => {
    setRemovingLinkId(linkId);

    await remove();

    setRemovingLinkId(null);
  };

  // Links also list incidents that link to the event without holding it.
  const isContainedIn = (linkedReport) => report.is_contained_in
    ?.some((relationship) => relationship.related_event.id === linkedReport.id);

  return <div data-testid="reportManager-linksSection">
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <LinkIcon aria-hidden="true" />

        <h2 ref={headingRef} tabIndex={-1}>{t('linksSection.linksHeader')}</h2>
      </div>
    </div>

    <ul className={styles.linkList}>
      {linkedReports.map((linkedReport) => <LinkItem
        isRemoveDisabled={isChangingLinks}
        isRemoving={removingLinkId === linkedReport.id}
        item={linkedReport}
        key={linkedReport.id}
        onRemove={eventLinkPermissions.canRemoveFromIncident && isContainedIn(linkedReport)
          ? () => removeLink(linkedReport.id, () => onRemoveFromIncident(report, linkedReport.id))
          : null}
        to={`/${TAB_KEYS.EVENTS}/${linkedReport.id}`}
        type={LINK_TYPES.EVENT}
      />)}

      {linkedPatrols.map((linkedPatrol) => <LinkItem
        isRemoveDisabled={isChangingLinks}
        isRemoving={removingLinkId === linkedPatrol.id}
        item={linkedPatrol}
        key={linkedPatrol.id}
        onRemove={eventLinkPermissions.canRemoveFromPatrol
          ? () => removeLink(linkedPatrol.id, () => onRemoveFromPatrol(report))
          : null}
        to={`/${TAB_KEYS.PATROLS}/${linkedPatrol.id}`}
        type={LINK_TYPES.PATROL}
      />)}
    </ul>
  </div>;
};

export default memo(LinksSection);
