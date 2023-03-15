import React, { memo, useCallback, useMemo } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';

import { hideFeatures, showFeatures } from '../ducks/map-ui';
import { getUniqueIDsFromFeatures } from '../utils/features';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';

import CheckableList from '../CheckableList';
import FeatureTypeListItem from './FeatureTypeListItem';

import listStyles from '../SideBar/styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};
const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const Trigger = ({ name }) => <h6 className={listStyles.trigger}>{name}</h6>;

const Content = (props) => {
  const { featuresByType, hideFeatures, showFeatures, hiddenFeatureIDs, name, map,
    featureFilterEnabled } = props;


  const allVisible = useCallback((type) =>
    !hiddenFeatureIDs.length
    || !intersection(
      hiddenFeatureIDs,
      getUniqueIDsFromFeatures(...type.features)
    ).length, [hiddenFeatureIDs]);

  const someVisible = useCallback((type) => {
    if (allVisible(type)) return false;

    const featureIDs = getUniqueIDsFromFeatures(...type.features);

    return intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
  }, [hiddenFeatureIDs, allVisible]);



  const onCheckToggle = useCallback((type) => {
    const featureIDs = getUniqueIDsFromFeatures(...type.features);
    if (allVisible(type)) {
      mapLayerTracker.track('Uncheck Feature Set Type checkbox',
      `Feature Set Type:${type.name}`);
      return hideFeatures(...featureIDs);
    } else {
      mapLayerTracker.track('Check Feature Set Type checkbox',
      `Feature Set Type:${type.name}`);
      return showFeatures(...featureIDs);
    }
  }, [allVisible, hideFeatures, showFeatures]);
  const collapsibleShouldBeOpen = featureFilterEnabled && !!featuresByType.length;
  const itemProps = useMemo(() => ({ map, featureFilterEnabled }), [map, featureFilterEnabled]);

  if (featureFilterEnabled && !featuresByType.length) return null;

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    trigger={<Trigger name={name} />}
    open={collapsibleShouldBeOpen} >
    <CheckableList
      className={listStyles.list}
      items={featuresByType}
      itemProps={itemProps}
      itemFullyChecked={allVisible}
      itemPartiallyChecked={someVisible}
      onCheckClick={onCheckToggle}
      itemComponent={FeatureTypeListItem}
    />
  </Collapsible>;
};

const mapStateToProps = ({ view: { hiddenFeatureIDs } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(Content));