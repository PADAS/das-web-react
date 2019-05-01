import React, { memo } from 'react';
import { connect } from 'react-redux';

import { getFeatureLayerListState } from './selectors';
import CheckableList from '../CheckableList';
import Content from './Content';

const FeatureLayerList = memo(({ featureList }) => {
  return <CheckableList
    // className={`${styles.list} ${styles.subjectList}`}
    items={featureList}
    // itemProps={subjectItemProps}
    itemFullyChecked={() => true}
    onCheckClick={() => console.log('clicky wicky')}
    itemComponent={Content}
    />;
});

const mapStateToProps = (state) => ({ featureList: getFeatureLayerListState(state) });

export default connect(mapStateToProps, null)(FeatureLayerList);