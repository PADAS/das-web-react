import React, { forwardRef, Fragment, /* useRef, */ memo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Flipper, Flipped } from 'react-flip-toolkit';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { openModalForPatrol, sortPatrolList } from '../utils/patrols';

import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';
import PatrolListItem from '../PatrolListItem';

const { ENABLE_PATROL_NEW_UI, ENABLE_UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;

const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const ListItem = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { map, onPatrolSelfManagedStateChange, patrol, onItemClick, ...rest } = props;

  const onTitleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item to open patrol modal');
    if (ENABLE_UFA_NAVIGATION_UI && ENABLE_PATROL_NEW_UI) return onItemClick(patrol.id);
    openModalForPatrol(patrol, map);
  }, [map, onItemClick, patrol]);

  return <Flipped flipId={patrol.id}>
    <PatrolListItem
      ref={ref}
      onTitleClick={onTitleClick}
      onSelfManagedStateChange={onPatrolSelfManagedStateChange}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
});

const PatrolList = ({ map, patrols = [], loading, onItemClick }) => {
  const [listItems, setListItems] = useState(patrols);

  const onPatrolSelfManagedStateChange = useCallback(() => {
    setListItems(sortPatrolList(patrols));
  }, [patrols]);

  useEffect(() => {
    setListItems(sortPatrolList(patrols));
  }, [patrols]);


  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <Fragment>
    {!ENABLE_UFA_NAVIGATION_UI && <PatrolListTitle />}
    {!!listItems.length && <Flipper
      flipKey={listItems}
      element='ul'
      className={ENABLE_UFA_NAVIGATION_UI ? styles.patrolList : styles.oldNavigationPatrolList}
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
  </Fragment>;
};

export default memo(PatrolList);

PatrolList.propTypes = {
  patrols: PropTypes.array,
  loading: PropTypes.bool,
};
