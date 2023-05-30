import React, { forwardRef, memo, useCallback, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Flipper, Flipped } from 'react-flip-toolkit';

import { FEATURE_FLAG_LABELS } from '../constants';
import { useFeatureFlag } from '../hooks';
import LoadingOverlay from '../LoadingOverlay';
import { MapContext } from '../App';
import { openModalForPatrol, sortPatrolList } from '../utils/patrols';

import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';
import PatrolListItem from '../PatrolListItem';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const ListItem = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { map, onPatrolSelfManagedStateChange, patrol, onItemClick, ...rest } = props;
  const enableNewPatrolUI = useFeatureFlag(ENABLE_PATROL_NEW_UI);

  const onClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item to open patrol modal');
    if (enableNewPatrolUI) return onItemClick(patrol.id);
    openModalForPatrol(patrol, map);
  }, [enableNewPatrolUI, map, onItemClick, patrol]);

  return <Flipped flipId={patrol.id}>
    <PatrolListItem
      ref={ref}
      onClick={onClick}
      onSelfManagedStateChange={onPatrolSelfManagedStateChange}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
});

const PatrolList = ({ patrols = [], loading, onItemClick }) => {
  const map = useContext(MapContext);

  const [listItems, setListItems] = useState(patrols);

  const onPatrolSelfManagedStateChange = useCallback(() => {
    setListItems(sortPatrolList(patrols));
  }, [patrols]);

  useEffect(() => {
    setListItems(sortPatrolList(patrols));
    console.log(sortPatrolList(patrols));
    console.log(patrols);
    console.log('\n\n\n');
  }, [patrols]);


  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <>
    {!!listItems.length && <Flipper
        flipKey={listItems}
        element='ul'
        className={styles.patrolList}
      >
      {listItems.map((item) =>
        <ListItem
          patrol={item}
          onPatrolSelfManagedStateChange={onPatrolSelfManagedStateChange}
          map={map}
          key={item.id}
          onItemClick={onItemClick}/>
      )}
    </Flipper>}
    {!listItems.length && <div className={styles.emptyMessage} key='no-patrols-to-display'>No patrols to display.</div>}
  </>;
};

export default memo(PatrolList);

PatrolList.propTypes = {
  patrols: PropTypes.array,
  loading: PropTypes.bool,
};
