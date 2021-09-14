import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { updateUserPreferences } from '../ducks/user-preferences';

const Map3DToggleControl = (props) => {
  const { virtualizeSunPosition, updateUserPreferences } = props;

  const setVirtualSunPrefence = useCallback(() => {
    updateUserPreferences({ virtualizeSunPosition: !virtualizeSunPosition });
  }, [virtualizeSunPosition, updateUserPreferences]);
  
  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={virtualizeSunPosition} onChange={setVirtualSunPrefence}/>
    <span> Virtual Sun Position</span>
  </label>;
};

const mapStateToProps = (state) => ({
  virtualizeSunPosition: state?.view?.userPreferences?.virtualizeSunPosition,
});

export default connect(mapStateToProps, { updateUserPreferences })(Map3DToggleControl);

