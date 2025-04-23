import React, { memo, useCallback, useContext } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from '../constants';
import { MapContext } from '../App';
import { ScrollRestoration } from '../SidebarScrollContext';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';

import * as styles from './styles.module.scss';
import PatrolListItem from '../PatrolListItem';

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const ListItem = ({ map, patrol, onItemClick, ref, ...rest }) => {
  const onClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item to open patrol modal');
    onItemClick(patrol.id);
  }, [onItemClick, patrol]);

  return <Flipped flipId={patrol.id}>
    <PatrolListItem
      ref={ref}
      onClick={onClick}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
};

const PatrolList = ({ patrols = [], loading, onItemClick }) => {
  const map = useContext(MapContext);
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolList' });

  if (loading) {
    return <div className={styles.loaderWrapper}>
      <MoonLoader />
    </div>;
  }

  return <>
    {!!patrols.length && <ScrollRestoration
        flipKey={patrols}
        element='ul'
        className={styles.patrolList}
        Component={Flipper}
        namespace={TAB_KEYS.PATROLS}
      >
      {patrols.map((item) =>
        <ListItem
          patrol={item}
          map={map}
          key={item.id}
          onItemClick={onItemClick}
        />
      )}
    </ScrollRestoration>}
    {!patrols.length && <div className={styles.emptyMessage} key='no-patrols-to-display'>
      {t('emptyPatrolList')}
    </div>}
  </>;
};

export default memo(PatrolList);
