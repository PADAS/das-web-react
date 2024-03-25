import React, { memo } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';

import { hideFeatures, showFeatures } from '../ducks/map-layer-filter';
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

const Content = (props) => {
  const { featuresByType, hideFeatures, showFeatures, hiddenFeatureIDs, name, map,
    featureFilterEnabled } = props;

  const { t } = useTranslation('layers', { keyPrefix: 'layerList' });

  if (featureFilterEnabled && !featuresByType.length) return null;

  const allVisible = type => !hiddenFeatureIDs.length || !intersection(hiddenFeatureIDs, getUniqueIDsFromFeatures(...type.features)).length;

  const someVisible = (type) => {
    const featureIDs = getUniqueIDsFromFeatures(...type.features);
    return !allVisible(type) && intersection(featureIDs, hiddenFeatureIDs).length !== featureIDs.length;
  };

  const onCheckToggle = (type) => {
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
  };

  const collapsibleShouldBeOpen = featureFilterEnabled && !!featuresByType.length;

  const itemProps = { map, featureFilterEnabled, };

  const trigger = <h6 className={listStyles.trigger}>{name}</h6>;

  return <Collapsible
    {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
    className={listStyles.collapsed}
    openedClassName={listStyles.opened}
    trigger={trigger}
    triggerElementProps={{
      label: t(collapsibleShouldBeOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel'),
      title: t(collapsibleShouldBeOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle'),
    }}
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

const mapStateToProps = ({ data: { mapLayerFilter: { hiddenFeatureIDs } } }) => ({ hiddenFeatureIDs });

export default connect(mapStateToProps, { hideFeatures, showFeatures })(memo(Content));