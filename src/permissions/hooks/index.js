
import { useSelector } from 'react-redux';
export const usePermissions = (permissionKey, ...permissions) =>  {
  const permissionSet = useSelector(state => {
    const permissionsSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;

    return permissionsSource?.permissions?.[permissionKey];
  }
  )
  || [];

  return permissions.every(item => permissionSet.includes(item));
};
