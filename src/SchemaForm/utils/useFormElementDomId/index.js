import { createContext, useContext } from 'react';

// Form element dom ids are namespaced with the id of the SchemaForm instance,
// so a document can hold more than one form without their ids colliding.
export const FormInstanceContext = createContext('');

const useFormElementDomId = (formElementId) => {
  const formInstanceId = useContext(FormInstanceContext);

  return formInstanceId ? `${formInstanceId}-${formElementId}` : formElementId;
};

export default useFormElementDomId;
