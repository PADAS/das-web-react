import axios from 'axios';

async function fetchPage(apiUrl, requestConfig, page, pageSize, maxRetries) {
  let attempt = 0;
  let data = null;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const response = await axios.get(`${apiUrl}&page=${page}&page_size=${pageSize}`, requestConfig);

      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }

      data = response.data.data;
      break;
    } catch (error) {
      console.log(`Error fetching page ${page} (attempt ${attempt}):`, error.message);
    }
  }

  if (attempt >= maxRetries) { // just logging in error, this place can be used to trigger a callback on maxRetries exhausted per page
    console.error(`Failed to fetch page ${page} after ${maxRetries} attempts.`);
  }

  return data;
}

async function parallelPaginatedRequest(apiUrl, requestConfig = {}, { itemsPerPage = 150, maxRetries = 3, concurrencyLimit = 5, onPageFetch = null } = {}) {

  const firstPageData = await fetchPage(apiUrl, requestConfig, 1, itemsPerPage, maxRetries);

  if (!firstPageData) {
    throw new Error('Failed to fetch the first page. Aborting.');
  }

  onPageFetch?.(firstPageData);

  const totalItems = firstPageData.count;
  let allItems = [...firstPageData.results];
  const pagesToFetch = Array.from({ length: Math.ceil(totalItems / itemsPerPage) - 1 }, (_, i) => i + 2); // Exclude page 1
  const activeFetches = new Set();

  const processPage = async (page) => {
    const data = await fetchPage(apiUrl, requestConfig, page, itemsPerPage, maxRetries);
    if (!!data) {
      onPageFetch?.(data);
      allItems = allItems.concat(data.results);
    }
  };

  for (const page of pagesToFetch) {
    while (activeFetches.size >= concurrencyLimit) {
      await Promise.race([...activeFetches]);
      console.log('Wait for any fetch to complete.');
    }

    const fetchPromise = processPage(page)
      .then(() => console.log(`Page ${page} completed.`))
      .catch(error => console.error(`Page ${page} failed after retries:`, error))
      .finally(() => activeFetches.delete(fetchPromise));

    activeFetches.add(fetchPromise);
  }

  await Promise.all([...activeFetches]);

  return allItems;
}

export default parallelPaginatedRequest;
