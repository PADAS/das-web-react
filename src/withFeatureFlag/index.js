import React from 'react';


const withFeatureFlag = (flag, Component) => props => !process.env[`REACT_APP_FF_${flag}`] ? null : <Component {...props} />;


export default withFeatureFlag;