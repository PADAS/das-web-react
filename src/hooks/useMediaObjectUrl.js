import { useEffect, useState } from 'react';

import { fetchFileAsObjectUrlFromUrl } from '../utils/file';

const NO_MEDIA = { error: false, objectUrl: null };

const useMediaObjectUrl = (url) => {
  const [fetchedMedia, setFetchedMedia] = useState(null);

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    let fetchedObjectUrl = null;
    let isCancelled = false;

    const fetchMedia = async () => {
      try {
        const objectUrl = await fetchFileAsObjectUrlFromUrl(url);

        // Revoking right away keeps a fetch that resolves after unmount from leaking its blob.
        if (isCancelled) {
          URL.revokeObjectURL(objectUrl);

          return;
        }

        fetchedObjectUrl = objectUrl;
        setFetchedMedia({ error: false, objectUrl, url });
      } catch (error) {
        // Attachment urls are signed and expire, so a rejection is expected.
        console.warn('Error downloading the media attachment: ', error);

        if (!isCancelled) {
          setFetchedMedia({ error: true, objectUrl: null, url });
        }
      }
    };

    fetchMedia();

    return () => {
      isCancelled = true;

      if (fetchedObjectUrl) {
        URL.revokeObjectURL(fetchedObjectUrl);
      }
    };
  }, [url]);

  return fetchedMedia?.url === url ? fetchedMedia : NO_MEDIA;
};

export default useMediaObjectUrl;
