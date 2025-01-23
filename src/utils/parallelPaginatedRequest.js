import axios from 'axios';

async function fetchPage(apiUrl, requestConfig, page, pageSize, maxRetries) {
  let attempt = 0;
  let data = null;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const response = await axios.get(`${apiUrl}&page=${page}&page_size=${pageSize}`, {
        ...requestConfig,
        timeout: 120000
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }

      data = response.data.data;
      break;
    } catch (error) {
      console.error(`Error fetching page ${page} (attempt ${attempt}):`, error.message);
    }
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
  let requestResults = [...firstPageData.results];
  const pagesToFetch = Math.ceil(totalItems / itemsPerPage) - 1;

  // Exclude page 1, producing an array on integer from page 2 to last page to fetch [2, 3, 4, ...]
  const arrayPagesToFetch = Array.from({ length: pagesToFetch }, (_, i) => i + 2);
  const requestsPool = new Set();

  const processPage = async (page) => {
    const response = await fetchPage(apiUrl, requestConfig, page, itemsPerPage, maxRetries);
    if (!!response) {
      onPageFetch?.(response);
      requestResults = requestResults.concat(response.results);
    }
  };

  for (const page of arrayPagesToFetch) {

    if (requestsPool.size >= concurrencyLimit) {
      await Promise.race(requestsPool);
    }

    const fetchPromise = processPage(page)
      .finally(() => requestsPool.delete(fetchPromise));

    requestsPool.add(fetchPromise);
  }

  await Promise.all(requestsPool);

  return requestResults;
}

export default parallelPaginatedRequest;
