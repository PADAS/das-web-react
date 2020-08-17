import React, { createContext, useContext, forwardRef } from 'react';

const FormDataContext = createContext();

const withFormDataContext = Component => forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const data = useContext(FormDataContext);
  const optionalProps = {};
  if (ref) optionalProps.ref = ref;
  return <Component {...props} {...optionalProps} data={data} />;
});

export { FormDataContext, withFormDataContext };