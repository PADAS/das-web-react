import { createContext } from 'react';

// The grid's own context option is read once, so the cells and headers read
// the table's latest handlers from here.
const FeedTableContext = createContext(null);

export default FeedTableContext;
