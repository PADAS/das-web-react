import React, { forwardRef, Fragment, /* useRef, */ memo, useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import merge from 'lodash/merge';
// import { findDOMNode } from 'react-dom';
import { Flipper, Flipped } from 'react-flip-toolkit';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { openModalForPatrol, sortPatrolList } from '../utils/patrols';
import { updatePatrol } from '../ducks/patrols';

import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';
import ListItem from '../PatrolListItem';

const PatrolListItem = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { map, onPatrolSelfManagedStateChange, patrol, updatePatrol, ...rest } = props;

  const onTitleClick = useCallback(() => {
    trackEvent('Patrol Card', 'Click patrol card to open patrol modal');
    openModalForPatrol(patrol, map);
  }, [map, patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrol, value);

    delete merged.updates;
    updatePatrol(merged);
  }, [patrol, updatePatrol]);

  return <Flipped flipId={patrol.id}>
    <ListItem
      ref={ref}
      onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      onSelfManagedStateChange={onPatrolSelfManagedStateChange}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
});

const ConnectedListItem = connect(null, { updatePatrol })(PatrolListItem);

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
    {!!listItems.length && <Flipper flipKey={listItems} element='ul' className={styles.patrolList}>

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
