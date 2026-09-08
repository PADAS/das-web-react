import { useEffect, useState } from 'react';

import { probeGeolocationPermission } from '../../utils/location/permission-probe';

const useGeolocationPermissionState = (isEnabled = true) => {
  const [geolocationPermissionState, setGeolocationPermissionState] = useState(null);

  useEffect(() => {
    if (!isEnabled) return;

    let isListening = true;

    // Browsers that don't support the Permissions API for geolocation, or don't know its permission name,
    // only reveal a blocked permission by attempting a read.
    const probePermission = () => probeGeolocationPermission().then((result) => {
      if (!isListening) return;

      setGeolocationPermissionState(result);
    });

    if (window.navigator.permissions?.query) {
      let permissionStatus;

      const onPermissionStateChange = (event) => setGeolocationPermissionState(event.target.state);

      window.navigator.permissions.query({ name: 'geolocation' })
        .then(
          (status) => {
            if (!isListening) return;

            setGeolocationPermissionState(status.state);

            status.addEventListener('change', onPermissionStateChange);

            permissionStatus = status;
          },
          probePermission
        );

      return () => {
        isListening = false;

        permissionStatus?.removeEventListener('change', onPermissionStateChange);
      };
    }

    probePermission();

    return () => {
      isListening = false;
    };
  }, [isEnabled]);

  return geolocationPermissionState;
};

export default useGeolocationPermissionState;
