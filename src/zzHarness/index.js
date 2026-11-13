import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import '../index.scss';

import i18n from '../i18nForTests';
import NavigationContextProvider from '../NavigationContextProvider';
import FeedTable, { TITLE_COLUMN } from '../FeedTable';

const ROWS = Array.from({ length: 80 }, (_, index) => ({ a: index, b: `B ${index}`, c: index * 3, id: `row-${index}`, title: `Row number ${index}` }));
const Details = () => <button type="button">Open</button>;
const COLUMNS = [
  { ...TITLE_COLUMN, cellRendererParams: { renderIcon: () => <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg> }, field: 'title', headerName: 'Title', sortable: true },
  { colId: 'a', field: 'a', headerName: 'Alpha', sortable: true, width: 140 },
  { colId: 'b', field: 'b', headerName: 'Beta', sortable: true, width: 160 },
  { colId: 'c', field: 'c', headerName: 'Gamma', sortable: true, width: 160 },
  { cellRenderer: Details, colId: 'd', headerName: 'Details', width: 160 },
];

const App = () => {
  const [toolbar, setToolbar] = useState(null);
  window.opened = window.opened || [];
  return <div style={{ display: 'flex', flexDirection: 'column', height: '600px', width: '900px' }}>
    <button type="button" id="before">Before</button>
    <div ref={setToolbar} />
    <FeedTable ariaLabel="Harness" columnDefs={COLUMNS} getRowId={(p) => p.data.id} getRowPath={(row) => `/rows/${row.id}`}
      onOpenRow={(row) => window.opened.push(row.id)} renderBulkActions={() => null} rowData={ROWS} tableKey="harness" toolbarContainer={toolbar} />
    <button type="button" id="after">After</button>
  </div>;
};

createRoot(document.getElementById('root')).render(<I18nextProvider i18n={i18n}><MemoryRouter><NavigationContextProvider><App /></NavigationContextProvider></MemoryRouter></I18nextProvider>);
