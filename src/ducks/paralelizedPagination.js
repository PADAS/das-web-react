
async function parallelPaginatedQuery(apiUrl, { itemsPerPage = 150, maxRetries = 3, concurrencyLimit = 5, onPageFetch }) {

  async function fetchPage(page, pageSize = itemsPerPage) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        attempt++;
        const response = await fetch(`${apiUrl}?page=${page}&page_size=${pageSize}`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        onPageFetch(data);
        return data;
      } catch (error) {
        console.error(`Error fetching page ${page} (attempt ${attempt}):`, error.message);
        if (attempt >= maxRetries) {
          console.error(`Failed to fetch page ${page} after ${maxRetries} attempts.`);
          return null; // Return null if retries are exhausted
        }
        console.log(`Retrying page ${page} (attempt ${attempt + 1})...`);
      }
    }
  }

  const firstPageData = await fetchPage(1);
  if (!firstPageData) {
    throw new Error('Failed to fetch the first page. Aborting.');
  }

  const totalItems = firstPageData.count;

  let allItems = [...firstPageData.results];

  const pagesToFetch = Array.from({ length: Math.ceil(totalItems / itemsPerPage) - 1 }, (_, i) => i + 2); // Exclude page 1

  const activeFetches = new Set();

  const processPage = async (page) => {
    const data = await fetchPage(page); // What happens if a page exhausted the attempts?
    if (data) {
      allItems = allItems.concat(data.results);
      console.log(`Fetched page ${page}.`);
    }
  };

  for (const page of pagesToFetch) {
    // Wait if we exceed concurrency limit
    while (activeFetches.size >= concurrencyLimit) {
      await Promise.race([...activeFetches]); // Wait for any fetch to complete
      console.log('Wait for any fetch to complete.');
    }

    // Start fetching the next page with retry logic
    const fetchPromise = processPage(page)
      .then(() => console.log(`Page ${page} completed.`))
      .catch(error => console.error(`Page ${page} failed after retries:`, error))
      .finally(() => activeFetches.delete(fetchPromise)); // Ensure cleanup only after retries are done

    activeFetches.add(fetchPromise);
  }

  // Wait for all remaining fetches to complete
  await Promise.all([...activeFetches]);

  return allItems;
}

export default parallelPaginatedQuery;
