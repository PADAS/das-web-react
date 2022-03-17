import React, { forwardRef, Fragment, /* useRef, */ memo, useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Flipper, Flipped } from 'react-flip-toolkit';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { patrolDrawerId } from '../Drawer';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { showDrawer } from '../ducks/drawer';
import { openModalForPatrol, sortPatrolList } from '../utils/patrols';
import { trackEventFactory, PATROL_LIST_ITEM_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';
import PatrolListItem from '../PatrolListItem';

const { PATROL_NEW_UI, UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;
const patrolListItemTracker = trackEventFactory(PATROL_LIST_ITEM_CATEGORY);

const ListItem = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { map, onPatrolSelfManagedStateChange, patrol, showDrawer, ...rest } = props;

  const onTitleClick = useCallback(() => {
    patrolListItemTracker.track('Click patrol list item to open patrol modal');
    if (PATROL_NEW_UI) return showDrawer(patrolDrawerId, { patrolId: patrol.id });
    openModalForPatrol(patrol, map);
  }, [map, patrol, showDrawer]);

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

const ConnectedListItem = connect(null, { showDrawer })(ListItem);

const PatrolList = (props) => {
  const { map, patrols = [], loading } = props;

  const [listItems, setListItems] = useState(patrols);

  const onPatrolSelfManagedStateChange = useCallback(() => {
    setListItems(sortPatrolList(patrols));
  }, [patrols]);

  useEffect(() => {
    setListItems(sortPatrolList(patrols));
  }, [patrols]);


  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <Fragment>
    <PatrolListTitle />
    {!!listItems.length && <Flipper
      flipKey={listItems}
      element='ul'
      className={UFA_NAVIGATION_UI ? styles.patrolList : styles.oldNavigationPatrolList}
    >
      {listItems.map((item) =>
        <ConnectedListItem
          patrol={item}
          onPatrolSelfManagedStateChange={onPatrolSelfManagedStateChange}
          map={map}
          key={item.id}/>
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
