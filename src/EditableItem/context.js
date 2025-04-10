import React, { createContext, useContext } from 'react';

const FormDataContext = createContext();

// eslint-disable-next-line react/display-name
const withFormDataContext = Component => ({ ref, ...otherProps }) => {
  const data = useContext(FormDataContext);
  const optionalProps = {};
  if (ref) optionalProps.ref = ref;
  return <Component {...otherProps} {...optionalProps} data={data} />;
};

export { FormDataContext, withFormDataContext };