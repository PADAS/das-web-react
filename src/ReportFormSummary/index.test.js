import React from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { EVENT_TYPE_SCHEMA_V1_URL } from '../ducks/event-schemas';
import { GPS_FORMATS } from '../utils/location';
import ReportFormSummary from './index';
import { report as mockedReport } from '../__test-helpers/fixtures/reports';
import { eventSchemas, snareSchemaV2 } from '../__test-helpers/fixtures/event-schemas';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { render, screen } from '../test-utils';

const server = setupServer(
  http.get(
    EVENT_TYPE_SCHEMA_V1_URL(':name'),
    () => HttpResponse.json( { data: eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6'] })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ReportFormSummary', () => {
  let store;
  beforeEach(() => {
    store = {
      data: {
        eventSchemas: {
          light_rep: {
            'd45cb504-4612-41fe-9ea5-f1b423ac3ba4': eventSchemas.wildlife_sighting_rep['a78576a5-3c5b-40df-b374-12db53fbfdd6']
          },
        },
        eventTypes,
      },
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const renderReportFormSummary = (props) => render(
    <Provider store={mockStore(store)}>
      <ReportFormSummary
        report={{
          ...mockedReport,
          event_details: {
            wildlifesightingrep_species: 'cheetah',
            wildlifesightingrep_numberanimals: 2,
            wildlifesightingrep_collared: 'yes',
          },
          reported_by: { name: 'Ranger' },
        }}
        {...props}
      />
    </Provider>
  );

  test('renders a loader while the schema is being loaded', () => {
    store.data.eventSchemas = {};
    renderReportFormSummary();

    expect(screen.getByTestId('reportFormSummary-loader')).toBeVisible();
  });

  test('render a form summary for a v1 schema', async () => {
    renderReportFormSummary();

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Ranger')).toBeInTheDocument();

    const numberAnimalsInput = screen.getByRole('spinbutton');
    expect(numberAnimalsInput).toHaveValue(2);
    expect(numberAnimalsInput).toHaveAttribute('disabled');

    const species = screen.getByRole('combobox', { name: 'Species' } );
    expect(species).toHaveValue('2');
    expect(species).toHaveAttribute('disabled');

    const animals = screen.getByRole('combobox', { name: 'Are Animals Collared' } );
    expect(animals).toHaveValue('0');
    expect(animals).toHaveAttribute('disabled');
  });

  test('hides the blank fields of a form summary for a v1 schema', async () => {
    const roleOptions = { name: 'Species' };
    const { rerender } = renderReportFormSummary();

    expect(screen.queryByRole('combobox', roleOptions )).toBeInTheDocument();

    rerender(<Provider store={mockStore(store)}>
      <ReportFormSummary
        report={{
          ...mockedReport,
          event_details: {
            wildlifesightingrep_numberanimals: 2,
            wildlifesightingrep_collared: 'yes',
          },
          reported_by: { name: 'Ranger' },
        }}
      />
    </Provider>);

    expect(screen.queryByRole('combobox', roleOptions)).not.toBeInTheDocument();
  });

  test('render a form summary for a v2 schema', async () => {
    store.data.eventTypes = [{ value: 'snare_v2_rep', version: 2 }];
    store.data.eventSchemas.snare_v2_rep = {
      'd45cb504-4612-41fe-9ea5-f1b423ac3ba4': snareSchemaV2,
    };
    renderReportFormSummary({
      report: {
        ...mockedReport,
        event_details: {
          number_of_snares_found: 3,
        },
        event_type: 'snare_v2_rep',
        reported_by: { name: 'Ranger' },
      }
    });

    expect(screen.getByText('Ranger')).toBeVisible();
    expect(screen.getByText('Number of Snares Found')).toBeVisible();
    expect(screen.getByText('3')).toBeVisible();
  });
});

