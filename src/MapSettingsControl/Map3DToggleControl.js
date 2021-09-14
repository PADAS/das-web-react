import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { updateUserPreferences } from '../ducks/user-preferences';

const Map3DToggleControl = (props) => {
  const { enable3D, updateUserPreferences } = props;

  const set3DMapEnabled = useCallback(() => {
    updateUserPreferences({ enable3D: !enable3D });
  }, [enable3D, updateUserPreferences]);
  

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={enable3D} onChange={set3DMapEnabled}/>
    <span> 3D Map Terrain</span>
  </label>;
};

const mapStateToProps = (state) => ({
  enable3D: state?.view?.userPreferences?.enable3D,
});

export default connect(mapStateToProps, { updateUserPreferences })(Map3DToggleControl);