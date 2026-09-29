import { useEffect, useState } from 'react';

import { fetchFileAsObjectUrlFromUrl } from '../utils/file';

const NO_MEDIA = { error: false, objectUrl: null };

const useMediaObjectUrl = (url) => {
  const [fetchedMedia, setFetchedMedia] = useState(null);

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    const abortController = new AbortController();
    let fetchedObjectUrl = null;

    const fetchMedia = async () => {
      try {
        const objectUrl = await fetchFileAsObjectUrlFromUrl(url, { signal: abortController.signal });

        // Revoking right away keeps a fetch that resolves after unmount from leaking its blob.
        if (abortController.signal.aborted) {
          URL.revokeObjectURL(objectUrl);
        } else {
          fetchedObjectUrl = objectUrl;
          setFetchedMedia({ error: false, objectUrl, url });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          // Attachment urls are signed and expire, so a rejection is expected.
          console.warn('Error downloading the media attachment: ', error);

          setFetchedMedia({ error: true, objectUrl: null, url });
        }
      }
    };

    fetchMedia();

    return () => {
      abortController.abort();

      if (fetchedObjectUrl) {
        URL.revokeObjectURL(fetchedObjectUrl);
      }
    };
  }, [url]);

  return fetchedMedia?.url === url ? fetchedMedia : NO_MEDIA;
};

export default useMediaObjectUrl;
