import React, { memo } from 'react';

import PatrolFilter from '../../PatrolFilter';
import PrototypePatrolList from '../../PatrolList/PrototypePatrolList';

// Prototype: only render the curated PrototypePatrolList (Figma reference)
// so the patrols list shows the example states + any user-created patrols.
const PatrolsFeedTab = () => {
  return <>
    <PatrolFilter />

    <PrototypePatrolList />
  </>;
};

export default memo(PatrolsFeedTab);
